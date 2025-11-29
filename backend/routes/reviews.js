const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// Get reviews for a business (public)
router.get('/business/:businessId', (req, res) => {
  const { businessId } = req.params;

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
      res.json(reviews);
    }
  );
});

// Create review (customer only)
// Create review: requires confirmed (or owner manual confirmed) appointment whose date passed
router.post('/', auth, (req, res) => {
  const { business_id, rating, comment } = req.body;

  if (!business_id || !rating) {
    return res.status(400).json({ error: 'Business ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  // Verify qualifying appointment: status confirmed/completed and date passed
  const todayStr = new Date().toISOString().slice(0,10);
  db.get(
    `SELECT id FROM appointments 
     WHERE business_id = ? AND customer_id = ? 
       AND status IN ('confirmed','completed') 
       AND appointment_date < ?
     ORDER BY appointment_date DESC LIMIT 1`,
    [business_id, req.user.id, todayStr],
    (err, appointment) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!appointment) {
        return res.status(403).json({ error: 'Onaylanmış ve tarihi geçmiş randevunuz yok' });
      }

      // Check if user already reviewed this business
      db.get(
        'SELECT * FROM reviews WHERE business_id = ? AND customer_id = ?',
        [business_id, req.user.id],
        (err, existingReview) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (existingReview) {
            return res.status(400).json({ error: 'Bu işletmeyi zaten değerlendirdiniz' });
          }

          db.run(
            'INSERT INTO reviews (business_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)',
            [business_id, req.user.id, rating, comment],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              db.get(
                `SELECT r.*, u.name as customer_name 
                 FROM reviews r 
                 JOIN users u ON r.customer_id = u.id 
                 WHERE r.id = ?`,
                [this.lastID],
                (err, review) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  res.status(201).json(review);
                }
              );
            }
          );
        }
      );
    }
  );
});

// Update review (customer only)
router.put('/:id', auth, (req, res) => {
  const reviewId = req.params.id;
  const { rating, comment } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  db.get(
    'SELECT * FROM reviews WHERE id = ? AND customer_id = ?',
    [reviewId, req.user.id],
    (err, review) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!review) {
        return res.status(404).json({ error: 'Review not found or access denied' });
      }

      db.run(
        'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
        [rating || review.rating, comment !== undefined ? comment : review.comment, reviewId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.get(
            `SELECT r.*, u.name as customer_name 
             FROM reviews r 
             JOIN users u ON r.customer_id = u.id 
             WHERE r.id = ?`,
            [reviewId],
            (err, updatedReview) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json(updatedReview);
            }
          );
        }
      );
    }
  );
});

// Delete review (customer only)
router.delete('/:id', auth, (req, res) => {
  const reviewId = req.params.id;

  db.get(
    'SELECT * FROM reviews WHERE id = ? AND customer_id = ?',
    [reviewId, req.user.id],
    (err, review) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!review) {
        return res.status(404).json({ error: 'Review not found or access denied' });
      }

      db.run('DELETE FROM reviews WHERE id = ?', [reviewId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Review deleted successfully' });
      });
    }
  );
});

module.exports = router;
