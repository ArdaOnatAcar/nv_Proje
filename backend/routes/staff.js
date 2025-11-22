const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

// Update staff (owner only)
router.put('/:id', auth, requireRole('business_owner'), (req, res) => {
  const staffId = parseInt(req.params.id, 10);
  const { name, active } = req.body;

  db.get(
    `SELECT st.*, b.owner_id FROM staff st
     JOIN businesses b ON st.business_id = b.id
     WHERE st.id = ? AND b.owner_id = ?`,
    [staffId, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Staff not found or access denied' });

      const newName = name !== undefined ? name : row.name;
      const newActive = active !== undefined ? (active ? 1 : 0) : row.active;

      db.run('UPDATE staff SET name = ?, active = ? WHERE id = ?', [newName, newActive, staffId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        db.get('SELECT id, business_id, name, active, created_at FROM staff WHERE id = ?', [staffId], (err3, updated) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json(updated);
        });
      });
    }
  );
});

// Get services assigned to a staff (owner only)
router.get('/:id/services', auth, requireRole('business_owner'), (req, res) => {
  const staffId = parseInt(req.params.id, 10);

  db.get(
    `SELECT st.*, b.owner_id FROM staff st
     JOIN businesses b ON st.business_id = b.id
     WHERE st.id = ? AND b.owner_id = ?`,
    [staffId, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Staff not found or access denied' });

      db.all('SELECT service_id FROM staff_services WHERE staff_id = ?', [staffId], (err2, list) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const service_ids = (list || []).map(x => x.service_id);
        res.json({ staff_id: staffId, service_ids });
      });
    }
  );
});

// Set services for a staff (owner only) - replaces the entire set
router.post('/:id/services', auth, requireRole('business_owner'), (req, res) => {
  const staffId = parseInt(req.params.id, 10);
  const { service_ids } = req.body;

  if (!Array.isArray(service_ids)) return res.status(400).json({ error: 'service_ids must be an array' });

  db.get(
    `SELECT st.*, b.owner_id FROM staff st
     JOIN businesses b ON st.business_id = b.id
     WHERE st.id = ? AND b.owner_id = ?`,
    [staffId, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Staff not found or access denied' });

      // Validate that all services belong to the same business
      const placeholders = service_ids.length ? service_ids.map(() => '?').join(',') : '';
      const validateAndApply = () => {
        db.serialize(() => {
          db.run('BEGIN');
          db.run('DELETE FROM staff_services WHERE staff_id = ?', [staffId], (delErr) => {
            if (delErr) { db.run('ROLLBACK'); return res.status(500).json({ error: delErr.message }); }
            if (!service_ids.length) {
              db.run('COMMIT', (cErr) => cErr ? res.status(500).json({ error: cErr.message }) : res.json({ staff_id: staffId, service_ids: [] }));
              return;
            }
            const stmt = db.prepare('INSERT INTO staff_services (staff_id, service_id) VALUES (?, ?)');
            for (const sid of service_ids) {
              stmt.run([staffId, sid]);
            }
            stmt.finalize((finErr) => {
              if (finErr) { db.run('ROLLBACK'); return res.status(500).json({ error: finErr.message }); }
              db.run('COMMIT', (cErr) => {
                if (cErr) return res.status(500).json({ error: cErr.message });
                res.json({ staff_id: staffId, service_ids });
              });
            });
          });
        });
      };

      if (service_ids.length) {
        db.all(`SELECT id FROM services WHERE id IN (${placeholders}) AND business_id = ?`, [...service_ids, row.business_id], (vErr, rows) => {
          if (vErr) return res.status(500).json({ error: vErr.message });
          if (!rows || rows.length !== service_ids.length) {
            return res.status(400).json({ error: 'All services must belong to the staff\'s business' });
          }
          validateAndApply();
        });
      } else {
        validateAndApply();
      }
    }
  );
});

module.exports = router;
