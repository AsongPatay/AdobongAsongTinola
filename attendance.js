// routes/attendance.js
//
// Handles: checking a participant in by scanning their QR code,
// and letting admins view who actually showed up.

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// POST /attendance/checkin
// Admin scans a participant's QR code (frontend sends the decoded qr_code string)
router.post('/checkin', verifyToken, requireAdmin, async (req, res) => {
  const { qr_code } = req.body;

  if (!qr_code) {
    return res.status(400).json({ message: 'qr_code is required' });
  }

  try {
    // Find the registration that matches this QR code
    const [regRows] = await db.query(
      'SELECT id, status FROM registrations WHERE qr_code = ?',
      [qr_code]
    );

    if (regRows.length === 0) {
      return res.status(404).json({ message: 'Invalid QR code — no matching registration' });
    }

    const registration = regRows[0];

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'This registration was cancelled' });
    }

    // Record the check-in
    await db.query(
      'INSERT INTO attendance (registration_id) VALUES (?)',
      [registration.id]
    );

    res.status(201).json({ message: 'Checked in successfully' });
  } catch (err) {
    // Duplicate check-in hits the UNIQUE KEY constraint on registration_id
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Already checked in' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /attendance/event/:eventId
// Admin views everyone who actually checked in for a given event
router.get('/event/:eventId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.checked_in_at, u.name, u.email
       FROM attendance a
       JOIN registrations r ON a.registration_id = r.id
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = ?
       ORDER BY a.checked_in_at ASC`,
      [req.params.eventId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
