const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

// List favorite businesses (detailed) for current customer
router.get('/', auth, requireRole('customer'), (req, res) => {
  db.all(
    `SELECT b.*, 
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(DISTINCT r.id) as review_count,
            f.created_at as favorited_at
     FROM favorites f
     JOIN businesses b ON b.id = f.business_id
     LEFT JOIN reviews r ON b.id = r.business_id
     WHERE f.customer_id = ?
     GROUP BY b.id
     ORDER BY f.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

// List favorite business ids only
router.get('/ids', auth, requireRole('customer'), (req, res) => {
  db.all('SELECT business_id FROM favorites WHERE customer_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.business_id));
  });
});

// Add favorite
router.post('/:businessId', auth, requireRole('customer'), (req, res) => {
  const businessId = parseInt(req.params.businessId, 10);
  if (!businessId) return res.status(400).json({ error: 'Invalid business id' });

  db.get('SELECT 1 FROM businesses WHERE id = ?', [businessId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Business not found' });

    db.run(
      'INSERT OR IGNORE INTO favorites (customer_id, business_id) VALUES (?, ?)',
      [req.user.id, businessId],
      function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        // Return current favorite status
        db.get('SELECT 1 FROM favorites WHERE customer_id = ? AND business_id = ?', [req.user.id, businessId], (err3, fav) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.status(201).json({ business_id: businessId, favorited: !!fav });
        });
      }
    );
  });
});

// Remove favorite
router.delete('/:businessId', auth, requireRole('customer'), (req, res) => {
  const businessId = parseInt(req.params.businessId, 10);
  if (!businessId) return res.status(400).json({ error: 'Invalid business id' });

  db.run('DELETE FROM favorites WHERE customer_id = ? AND business_id = ?', [req.user.id, businessId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ business_id: businessId, favorited: false });
  });
});

module.exports = router;
