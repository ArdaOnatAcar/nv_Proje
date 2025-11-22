const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

// Get all services for a business (public)
router.get('/business/:businessId', (req, res) => {
  const { businessId } = req.params;

  db.all(
    'SELECT * FROM services WHERE business_id = ? ORDER BY price',
    [businessId],
    (err, services) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(services);
    }
  );
});

// Create service (business owner only)
router.post('/', auth, requireRole('business_owner'), (req, res) => {
  const { business_id, name, description, price, duration } = req.body;

  if (!business_id || !name || !price || !duration) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Verify business ownership
  db.get('SELECT * FROM businesses WHERE id = ? AND owner_id = ?', [business_id, req.user.id], (err, business) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!business) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.run(
      'INSERT INTO services (business_id, name, description, price, duration) VALUES (?, ?, ?, ?, ?)',
      [business_id, name, description, price, duration],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get('SELECT * FROM services WHERE id = ?', [this.lastID], (err, service) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(service);
        });
      }
    );
  });
});

// Update service (business owner only)
router.put('/:id', auth, requireRole('business_owner'), (req, res) => {
  const serviceId = req.params.id;
  const { name, description, price, duration } = req.body;

  // Verify ownership through business
  db.get(
    `SELECT s.* FROM services s 
     JOIN businesses b ON s.business_id = b.id 
     WHERE s.id = ? AND b.owner_id = ?`,
    [serviceId, req.user.id],
    (err, service) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!service) {
        return res.status(404).json({ error: 'Service not found or access denied' });
      }

      db.run(
        'UPDATE services SET name = ?, description = ?, price = ?, duration = ? WHERE id = ?',
        [name, description, price, duration, serviceId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.get('SELECT * FROM services WHERE id = ?', [serviceId], (err, updatedService) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json(updatedService);
          });
        }
      );
    }
  );
});

// Delete service (business owner only)
router.delete('/:id', auth, requireRole('business_owner'), (req, res) => {
  const serviceId = req.params.id;

  db.get(
    `SELECT s.* FROM services s 
     JOIN businesses b ON s.business_id = b.id 
     WHERE s.id = ? AND b.owner_id = ?`,
    [serviceId, req.user.id],
    (err, service) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!service) {
        return res.status(404).json({ error: 'Service not found or access denied' });
      }

      db.run('DELETE FROM services WHERE id = ?', [serviceId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Service deleted successfully' });
      });
    }
  );
});

module.exports = router;
