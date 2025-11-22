const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// Get all appointments for current user
router.get('/my-appointments', auth, (req, res) => {
  let query;
  let params = [req.user.id];

  if (req.user.role === 'customer') {
    query = `
      SELECT a.*, b.name as business_name, s.name as service_name, s.duration, s.price
      FROM appointments a
      JOIN businesses b ON a.business_id = b.id
      JOIN services s ON a.service_id = s.id
      WHERE a.customer_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
  } else if (req.user.role === 'business_owner') {
    query = `
      SELECT a.*, b.name as business_name, s.name as service_name, 
             s.duration, s.price,
             a.customer_name AS manual_customer_name,
             a.customer_phone AS manual_customer_phone,
             u.name as account_customer_name, u.email as account_customer_email, u.phone as account_customer_phone
      FROM appointments a
      JOIN businesses b ON a.business_id = b.id
      JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.customer_id = u.id
      WHERE b.owner_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
  }

  db.all(query, params, (err, appointments) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(appointments);
  });
});

// Get available time slots for a business on a specific date
// Removed legacy available-slots endpoint in favor of /businesses/:id/availability

// Create appointment (customer flow; also supports owner manual booking branch)
router.post('/', auth, (req, res) => {
  // Owner manual booking branch
  const isOwnerFlow = req.user.role === 'business_owner' && req.body.start_time && req.body.customer_name && req.body.customer_phone;
  if (isOwnerFlow) {
    const { business_id, service_id, appointment_date, start_time, customer_name, customer_phone, notes } = req.body;

    if (!business_id || !service_id || !appointment_date || !start_time || !customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify ownership and fetch business hours
    db.get('SELECT * FROM businesses WHERE id = ? AND owner_id = ?', [business_id, req.user.id], (err, biz) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!biz) return res.status(403).json({ error: 'Access denied' });

      // Settings (defaults)
      db.get('SELECT * FROM business_settings WHERE business_id = ?', [business_id], (err, settings) => {
        if (err) return res.status(500).json({ error: err.message });
        const slotInterval = settings?.slot_interval_minutes ?? 15;
        const minNotice = settings?.min_notice_minutes ?? 60;

        // Service validation
        db.get('SELECT * FROM services WHERE id = ? AND business_id = ?', [service_id, business_id], (err, service) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!service) return res.status(400).json({ error: 'Service not found for business' });

          const toMinutes = (hhmm) => { const [h,m] = String(hhmm).split(':').map(Number); return h*60+m; };
          const toHHMM = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
          const openMin = toMinutes(biz.opening_time || '09:00');
          const closeMin = toMinutes(biz.closing_time || '18:00');
          const startMin = toMinutes(start_time);
          const need = Number(service.duration);
          const endMin = startMin + need;

          // grid alignment
          if (startMin % slotInterval !== 0) {
            return res.status(400).json({ error: 'Start time not aligned to slot grid' });
          }
          // within business hours
          if (startMin < openMin || endMin > closeMin) {
            return res.status(400).json({ error: 'Service exceeds business hours' });
          }
          // min notice (GMT+3 assumed)
          const now = new Date();
          const nowGmt3 = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60 * 1000);
          const todayStr = nowGmt3.toISOString().slice(0,10);
          const todayLocalMinutes = nowGmt3.getHours()*60 + nowGmt3.getMinutes();
          const minStartMinsToday = todayLocalMinutes + minNotice;
          if (appointment_date === todayStr && startMin < minStartMinsToday) {
            return res.status(400).json({ error: 'Min notice not satisfied' });
          }

          // Capable active staff
          db.all(
            `SELECT st.id FROM staff st
             JOIN staff_services ss ON ss.staff_id = st.id
             WHERE st.business_id = ? AND st.active = 1 AND ss.service_id = ?`,
            [business_id, service_id],
            (err, staffRows) => {
              if (err) return res.status(500).json({ error: err.message });
              if (!staffRows.length) return res.status(409).json({ error: 'No available staff for this slot' });

              const candidateIds = staffRows.map(s => s.id);

              const tryAssign = (idx) => {
                if (idx >= candidateIds.length) return res.status(409).json({ error: 'No available staff for this slot' });
                const staffId = candidateIds[idx];

                // Quick overlap check
                db.get(
                  `SELECT 1 FROM appointments 
                   WHERE business_id = ? AND appointment_date = ? AND staff_id = ? AND status != 'cancelled'
                     AND start_time < ? AND ? < end_time
                   LIMIT 1`,
                  [business_id, appointment_date, staffId, toHHMM(endMin), toHHMM(startMin)],
                  (err, overlap) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (overlap) return tryAssign(idx+1);

                    // Transactional re-check + insert
                    db.serialize(() => {
                      db.run('BEGIN IMMEDIATE');
                      db.get(
                        `SELECT 1 FROM appointments 
                         WHERE business_id = ? AND appointment_date = ? AND staff_id = ? AND status != 'cancelled'
                           AND start_time < ? AND ? < end_time
                         LIMIT 1`,
                        [business_id, appointment_date, staffId, toHHMM(endMin), toHHMM(startMin)],
                        (err2, again) => {
                          if (err2) { db.run('ROLLBACK'); return res.status(500).json({ error: err2.message }); }
                          if (again) { db.run('ROLLBACK'); return res.status(409).json({ error: 'Staff just became busy, pick another slot' }); }

                          db.run(
                            `INSERT INTO appointments 
                             (business_id, service_id, customer_id, customer_name, customer_phone, appointment_date, appointment_time, start_time, end_time, staff_id, status, notes, source)
                             VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 'owner_manual')`,
                            [business_id, service_id, customer_name, customer_phone, appointment_date, toHHMM(startMin), toHHMM(startMin), toHHMM(endMin), staffId, notes || null],
                            function(err3) {
                              if (err3) { db.run('ROLLBACK'); return res.status(500).json({ error: err3.message }); }
                              db.run('COMMIT', (err4) => {
                                if (err4) return res.status(500).json({ error: err4.message });
                                return res.status(201).json({
                                  appointment_id: this.lastID,
                                  staff_id: staffId,
                                  start_time,
                                  end_time: toHHMM(endMin),
                                  status: 'confirmed',
                                  source: 'owner_manual'
                                });
                              });
                            }
                          );
                        }
                      );
                    });
                  }
                );
              };
              tryAssign(0);
            }
          );
        });
      });
    });
    return; // prevent falling into customer flow
  }

  // Block owners from using the customer booking flow
  if (req.user.role === 'business_owner') {
    return res.status(403).json({ error: 'Business owners cannot create appointments via customer flow' });
  }

  // Customer flow (updated to use same auto-assign staff logic)
  const { business_id, service_id, appointment_date, start_time, notes } = req.body;

  if (!business_id || !service_id || !appointment_date || !start_time) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Fetch business (hours)
  db.get('SELECT * FROM businesses WHERE id = ?', [business_id], (err, biz) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    // Settings
    db.get('SELECT * FROM business_settings WHERE business_id = ?', [business_id], (err, settings) => {
      if (err) return res.status(500).json({ error: err.message });
      const slotInterval = settings?.slot_interval_minutes ?? 15;
      const minNotice = settings?.min_notice_minutes ?? 60;

      // Service
      db.get('SELECT * FROM services WHERE id = ? AND business_id = ?', [service_id, business_id], (err, service) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!service) return res.status(400).json({ error: 'Service not found for business' });

        const toMinutes = (hhmm) => { const [h,m] = String(hhmm).split(':').map(Number); return h*60+m; };
        const toHHMM = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
        const openMin = toMinutes(biz.opening_time || '09:00');
        const closeMin = toMinutes(biz.closing_time || '18:00');
        const startMin = toMinutes(start_time);
        const need = Number(service.duration);
        const endMin = startMin + need;

        if (startMin % slotInterval !== 0) {
          return res.status(400).json({ error: 'Start time not aligned to slot grid' });
        }
        if (startMin < openMin || endMin > closeMin) {
          return res.status(400).json({ error: 'Service exceeds business hours' });
        }
        // min notice (GMT+3)
        const now = new Date();
        const nowGmt3 = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60 * 1000);
        const todayStr = nowGmt3.toISOString().slice(0,10);
        const todayLocalMinutes = nowGmt3.getHours()*60 + nowGmt3.getMinutes();
        const minStartMinsToday = todayLocalMinutes + minNotice;
        if (appointment_date === todayStr && startMin < minStartMinsToday) {
          return res.status(400).json({ error: 'Min notice not satisfied' });
        }

        // Capable staff
        db.all(
          `SELECT st.id FROM staff st
           JOIN staff_services ss ON ss.staff_id = st.id
           WHERE st.business_id = ? AND st.active = 1 AND ss.service_id = ?`,
          [business_id, service_id],
          (err, staffRows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!staffRows.length) return res.status(409).json({ error: 'No available staff for this slot' });

            const candidateIds = staffRows.map(s => s.id);

            const tryAssign = (idx) => {
              if (idx >= candidateIds.length) return res.status(409).json({ error: 'No available staff for this slot' });
              const staffId = candidateIds[idx];

              db.get(
                `SELECT 1 FROM appointments 
                 WHERE business_id = ? AND appointment_date = ? AND staff_id = ? AND status != 'cancelled'
                   AND start_time < ? AND ? < end_time
                 LIMIT 1`,
                [business_id, appointment_date, staffId, toHHMM(endMin), toHHMM(startMin)],
                (err, overlap) => {
                  if (err) return res.status(500).json({ error: err.message });
                  if (overlap) return tryAssign(idx+1);

                  db.serialize(() => {
                    db.run('BEGIN IMMEDIATE');
                    db.get(
                      `SELECT 1 FROM appointments 
                       WHERE business_id = ? AND appointment_date = ? AND staff_id = ? AND status != 'cancelled'
                         AND start_time < ? AND ? < end_time
                       LIMIT 1`,
                      [business_id, appointment_date, staffId, toHHMM(endMin), toHHMM(startMin)],
                      (err2, again) => {
                        if (err2) { db.run('ROLLBACK'); return res.status(500).json({ error: err2.message }); }
                        if (again) { db.run('ROLLBACK'); return res.status(409).json({ error: 'Staff just became busy, pick another slot' }); }

                        db.run(
                          `INSERT INTO appointments 
                           (business_id, service_id, customer_id, appointment_date, appointment_time, start_time, end_time, staff_id, status, notes, source)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'customer')`,
                          [business_id, service_id, req.user.id, appointment_date, toHHMM(startMin), toHHMM(startMin), toHHMM(endMin), staffId, notes || null],
                          function(err3) {
                            if (err3) { db.run('ROLLBACK'); return res.status(500).json({ error: err3.message }); }
                            db.run('COMMIT', (err4) => {
                              if (err4) return res.status(500).json({ error: err4.message });
                              return res.status(201).json({
                                appointment_id: this.lastID,
                                staff_id: staffId,
                                start_time: toHHMM(startMin),
                                end_time: toHHMM(endMin),
                                status: 'pending',
                                source: 'customer'
                              });
                            });
                          }
                        );
                      }
                    );
                  });
                }
              );
            };
            tryAssign(0);
          }
        );
      });
    });
  });
});

// Update appointment status
router.put('/:id/status', auth, (req, res) => {
  const appointmentId = req.params.id;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Verify access
  let query;
  if (req.user.role === 'customer') {
    query = 'SELECT * FROM appointments WHERE id = ? AND customer_id = ?';
  } else if (req.user.role === 'business_owner') {
    query = `SELECT a.* FROM appointments a 
             JOIN businesses b ON a.business_id = b.id 
             WHERE a.id = ? AND b.owner_id = ?`;
  }

  db.get(query, [appointmentId, req.user.id], (err, appointment) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or access denied' });
    }

    db.run(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, appointmentId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT * FROM appointments WHERE id = ?', [appointmentId], (err, updatedAppointment) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(updatedAppointment);
        });
      }
    );
  });
});

module.exports = router;
