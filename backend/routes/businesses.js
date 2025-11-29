const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

// Get all businesses (public)
router.get('/', (req, res) => {
  const { type, search, city, district, sort, reviewCountRange, minRating } = req.query;
  let query = `
    SELECT b.*, 
           COALESCE(AVG(r.rating), 0) as average_rating,
           COUNT(DISTINCT r.id) as review_count
    FROM businesses b
    LEFT JOIN reviews r ON b.id = r.business_id
  `;
  const params = [];

  const conditions = [];
  if (type) {
    conditions.push('b.type = ?');
    params.push(type);
  }
  if (city) {
    conditions.push('b.city = ?');
    params.push(city);
  }
  if (district) {
    conditions.push('b.district = ?');
    params.push(district);
  }
  if (search) {
    conditions.push('(b.name LIKE ? OR b.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY b.id';

  // Filtering by rating threshold
  let havingClauses = [];
  if (minRating) {
    const val = parseFloat(minRating);
    if (!isNaN(val)) havingClauses.push('AVG(r.rating) >= ' + val);
  }
  if (reviewCountRange) {
    if (reviewCountRange === '0-50') havingClauses.push('COUNT(DISTINCT r.id) BETWEEN 0 AND 50');
    else if (reviewCountRange === '50-200') havingClauses.push('COUNT(DISTINCT r.id) BETWEEN 51 AND 200');
    else if (reviewCountRange === '200+') havingClauses.push('COUNT(DISTINCT r.id) >= 201');
  }
  if (havingClauses.length) {
    query += ' HAVING ' + havingClauses.join(' AND ');
  }

  // Sorting
  if (sort === 'rating') {
    query += ' ORDER BY AVG(r.rating) DESC, COUNT(DISTINCT r.id) DESC';
  } else if (sort === 'reviews') {
    query += ' ORDER BY COUNT(DISTINCT r.id) DESC, AVG(r.rating) DESC';
  } else {
    query += ' ORDER BY b.created_at DESC';
  }

  db.all(query, params, (err, businesses) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(businesses);
  });
});

// Availability for owner form (service-aware, staff-aware)
// Availability is accessible to authenticated customers and owners; no ownership check
router.get('/:id/availability', auth, (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  const { service_id, date } = req.query;

  if (!service_id || !date) {
    return res.status(400).json({ error: 'service_id and date are required' });
  }

  // Fetch business (no ownership gate here)
  db.get('SELECT * FROM businesses WHERE id = ?', [businessId], (err, biz) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    // Settings (defaults if not set)
    db.get('SELECT * FROM business_settings WHERE business_id = ?', [businessId], (err, settings) => {
      if (err) return res.status(500).json({ error: err.message });

  const slotInterval = settings?.slot_interval_minutes ?? 15;
  const minNotice = settings?.min_notice_minutes ?? 60;
  const bookingWindowDays = settings?.booking_window_days ?? 30;

      // Service + capable staff
      db.get('SELECT * FROM services WHERE id = ? AND business_id = ?', [service_id, businessId], (err, service) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!service) return res.status(400).json({ error: 'Service not found for business' });

        db.all(
          `SELECT st.id FROM staff st
           JOIN staff_services ss ON ss.staff_id = st.id
           WHERE st.business_id = ? AND st.active = 1 AND ss.service_id = ?`,
          [businessId, service_id],
          (err, staffRows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!staffRows.length) return res.json({ date, slots: [] });

            const staffIds = staffRows.map(s => s.id);
            const open = biz.opening_time || '09:00';
            const close = biz.closing_time || '18:00';

            const toMinutes = (hhmm) => {
              const [h, m] = String(hhmm).split(':').map(Number);
              return h * 60 + m;
            };
            const toHHMM = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

            const openMin = toMinutes(open);
            const closeMin = toMinutes(close);
            const need = Number(service.duration);

            // min_notice (GMT+3 assumed) and booking window
            const now = new Date();
            const nowGmt3 = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60 * 1000);
            const todayStr = nowGmt3.toISOString().slice(0, 10);
            const todayLocalMinutes = nowGmt3.getHours() * 60 + nowGmt3.getMinutes();
            const minStartCutoff = todayLocalMinutes + minNotice;

            // booking_window_days enforcement
            const target = new Date(`${date}T00:00:00Z`);
            const todayUtcMid = new Date(nowGmt3.getUTCFullYear(), nowGmt3.getUTCMonth(), nowGmt3.getUTCDate());
            const diffDays = Math.floor((target.getTime() - todayUtcMid.getTime()) / (24 * 60 * 60 * 1000));
            if (diffDays < 0 || diffDays > bookingWindowDays) {
              return res.status(400).json({ error: 'Date outside booking window' });
            }

            // Pull appointments of the day (only those with staff_id assigned)
            db.all(
              `SELECT staff_id, start_time, end_time, appointment_time, s.duration as service_duration
               FROM appointments a
               JOIN services s ON s.id = a.service_id
               WHERE a.business_id = ? AND a.appointment_date = ? AND a.status != 'cancelled' AND (a.staff_id IS NOT NULL)`,
              [businessId, date],
              (err, appts) => {
                if (err) return res.status(500).json({ error: err.message });

                const bookingsByStaff = new Map();
                for (const sId of staffIds) bookingsByStaff.set(sId, []);
                const pushInterval = (map, staffId, startStr, endStr, fallbackDuration) => {
                  const start = startStr ? toMinutes(startStr) : toMinutes(endStr) - fallbackDuration;
                  const end = endStr ? toMinutes(endStr) : toMinutes(startStr) + fallbackDuration;
                  if (!Number.isFinite(start) || !Number.isFinite(end)) return;
                  if (!map.has(staffId)) map.set(staffId, []);
                  map.get(staffId).push([start, end]);
                };

                for (const a of appts) {
                  if (a.staff_id) {
                    // If historic rows lack start/end, approximate via appointment_time + duration
                    const fallback = Number(a.service_duration) || need;
                    const st = a.start_time || a.appointment_time;
                    const et = a.end_time || (st ? toHHMM(toMinutes(st) + fallback) : null);
                    pushInterval(bookingsByStaff, a.staff_id, st, et, fallback);
                  }
                }

                const slots = [];
                for (let t = openMin; t + need <= closeMin; t += slotInterval) {
                  if (date === todayStr && t < minStartCutoff) continue; // honor min_notice for today
                  let available = 0;
                  const aStart = t;
                  const aEnd = t + need;
                  for (const sId of staffIds) {
                    const intervals = bookingsByStaff.get(sId) || [];
                    const overlaps = intervals.some(([bStart, bEnd]) => (aStart < bEnd) && (bStart < aEnd));
                    if (!overlaps) available++;
                  }
                  if (available > 0) slots.push({ time: toHHMM(t), available_count: available });
                }

                res.json({ date, slots });
              }
            );
          }
        );
      });
    });
  });
});

// Get single business with details (public)
router.get('/:id', (req, res) => {
  const businessId = req.params.id;

  db.get(
    `SELECT b.*, 
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as review_count
     FROM businesses b
     LEFT JOIN reviews r ON b.id = r.business_id
     WHERE b.id = ?
     GROUP BY b.id`,
    [businessId],
    (err, business) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // Get services
      db.all(
        'SELECT * FROM services WHERE business_id = ? ORDER BY price',
        [businessId],
        (err, services) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get reviews
          db.all(
            `SELECT r.*, u.name as customer_name 
             FROM reviews r 
             JOIN users u ON r.customer_id = u.id 
             WHERE r.business_id = ? 
             ORDER BY r.created_at DESC`,
            [businessId],
            (err, reviews) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.json({
                ...business,
                services,
                reviews
              });
            }
          );
        }
      );
    }
  );
});

// Create business (business owner only)
router.post('/', auth, requireRole('business_owner'), (req, res) => {
  const {
    name,
    type,
    description,
    city,
    district,
    address,
    phone,
    image_url,
    opening_time,
    closing_time
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  db.run(
    `INSERT INTO businesses (owner_id, name, type, description, city, district, address, phone, image_url, opening_time, closing_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, type, description, city, district, address, phone, image_url, opening_time, closing_time],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM businesses WHERE id = ?', [this.lastID], (err, business) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(business);
      });
    }
  );
});

// Update business (business owner only)
router.put('/:id', auth, requireRole('business_owner'), (req, res) => {
  const businessId = req.params.id;
  const {
    name,
    type,
    description,
    city,
    district,
    address,
    phone,
    image_url,
    opening_time,
    closing_time
  } = req.body;

  // Verify ownership
  db.get('SELECT * FROM businesses WHERE id = ? AND owner_id = ?', [businessId, req.user.id], (err, business) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!business) {
      return res.status(404).json({ error: 'Business not found or access denied' });
    }

    db.run(
      `UPDATE businesses 
       SET name = ?, type = ?, description = ?, city = ?, district = ?, address = ?, phone = ?, 
           image_url = ?, opening_time = ?, closing_time = ?
       WHERE id = ?`,
      [name, type, description, city, district, address, phone, image_url, opening_time, closing_time, businessId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT * FROM businesses WHERE id = ?', [businessId], (err, updatedBusiness) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(updatedBusiness);
        });
      }
    );
  });
});

// Delete business (business owner only)
router.delete('/:id', auth, requireRole('business_owner'), (req, res) => {
  const businessId = req.params.id;

  db.get('SELECT * FROM businesses WHERE id = ? AND owner_id = ?', [businessId, req.user.id], (err, business) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!business) {
      return res.status(404).json({ error: 'Business not found or access denied' });
    }

    db.run('DELETE FROM businesses WHERE id = ?', [businessId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Business deleted successfully' });
    });
  });
});

// Get businesses owned by current user
router.get('/owner/my-businesses', auth, requireRole('business_owner'), (req, res) => {
  db.all(
    `SELECT b.*, 
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as review_count
     FROM businesses b
     LEFT JOIN reviews r ON b.id = r.business_id
     WHERE b.owner_id = ?
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [req.user.id],
    (err, businesses) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Fetch services for each business
      const businessesWithServices = [];
      let completed = 0;
      
      if (businesses.length === 0) {
        return res.json([]);
      }
      
      businesses.forEach((business) => {
        db.all(
          'SELECT * FROM services WHERE business_id = ? ORDER BY price',
          [business.id],
          (err, services) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            businessesWithServices.push({
              ...business,
              services: services || []
            });
            
            completed++;
            if (completed === businesses.length) {
              res.json(businessesWithServices);
            }
          }
        );
      });
    }
  );
});

// List staff for a business (owner only)
router.get('/:id/staff', auth, requireRole('business_owner'), (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  // ownership check
  db.get('SELECT 1 FROM businesses WHERE id = ? AND owner_id = ?', [businessId, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(403).json({ error: 'Access denied' });

    db.all('SELECT id, name, active, created_at FROM staff WHERE business_id = ? ORDER BY created_at DESC', [businessId], (err, staff) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(staff || []);
    });
  });
});

// Create staff for a business (owner only)
router.post('/:id/staff', auth, requireRole('business_owner'), (req, res) => {
  const businessId = parseInt(req.params.id, 10);
  const { name, active = 1 } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  db.get('SELECT 1 FROM businesses WHERE id = ? AND owner_id = ?', [businessId, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(403).json({ error: 'Access denied' });

    db.run('INSERT INTO staff (business_id, name, active) VALUES (?, ?, ?)', [businessId, name, active ? 1 : 0], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT id, name, active, created_at FROM staff WHERE id = ?', [this.lastID], (err2, staff) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json(staff);
      });
    });
  });
});

module.exports = router;
