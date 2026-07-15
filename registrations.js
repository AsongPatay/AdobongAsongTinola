// routes/registrations.js
//
// Handles: signing up for an event, viewing registrations, cancelling.
// Each successful registration gets a unique qr_code string, which is
// turned into an actual scannable QR image via the /qr/:code endpoint.

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// POST /registrations
// Logged-in user registers for an event
router.post('/', verifyToken, async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;

  if (!event_id) {
    return res.status(400).json({ message: 'event_id is required' });
  }

  try {
    // Confirm the event actually exists (owned by Event Management teammate's table)
    const [eventRows] = await db.query('SELECT id FROM events WHERE id = ?', [event_id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Generate a unique code that will be embedded in the QR image
    const qr_code = crypto.randomBytes(16).toString('hex');

    const [result] = await db.query(
      'INSERT INTO registrations (user_id, event_id, qr_code) VALUES (?, ?, ?)',
      [user_id, event_id, qr_code]
    );

    res.status(201).json({
      message: 'Registered successfully',
      registration_id: result.insertId,
      qr_code,
      qr_image_url: `/registrations/qr/${qr_code}`,
    });
  } catch (err) {
    // Duplicate registration (same user + event) hits the UNIQUE KEY constraint
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Already registered for this event' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /registrations/qr/:code
// Returns an actual QR code image (PNG) for the given code
router.get('/qr/:code', async (req, res) => {
  try {
    const qrImageBuffer = await QRCode.toBuffer(req.params.code);
    res.type('png').send(qrImageBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate QR image' });
  }
});

// GET /registrations/my
// Logged-in user views their own registrations
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.qr_code, r.status, r.registered_at, e.title, e.date, e.location
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /registrations/event/:eventId
// Admin views everyone registered for a specific event
router.get('/event/:eventId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.qr_code, r.status, r.registered_at, u.name, u.email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = ?`,
      [req.params.eventId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /registrations/:id
// Logged-in user cancels their own registration
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE registrations SET status = "cancelled" WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
