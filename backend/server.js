require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
const db = require('./config/database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/locations', require('./routes/locations'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Randex API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  // Cleanup job: delete appointments older than 1 day
  const runCleanup = () => {
    // Delete appointments whose appointment_date is earlier than (today - 1 day)
    // Using SQLite date functions; safe for all statuses
    const sql = `DELETE FROM appointments WHERE appointment_date < DATE('now', '-1 day')`;
    db.run(sql, [], function(err) {
      if (err) {
        console.error('Cleanup error (appointments):', err.message);
      } else if (this.changes) {
        console.log(`Cleanup removed ${this.changes} old appointments.`);
      }
    });
  };
  // Run on startup and then daily
  runCleanup();
  setInterval(runCleanup, 24 * 60 * 60 * 1000);
});

module.exports = app;
