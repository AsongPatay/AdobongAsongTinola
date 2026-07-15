-- ============================================
-- PART B: Registration + Attendance + QR Check-in
-- Run this AFTER the users and events tables exist
-- (those belong to Auth / Event Management teammates)
-- ============================================

CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  qr_code VARCHAR(64) NOT NULL UNIQUE,   -- unique code embedded in the QR image
  status ENUM('registered', 'cancelled') DEFAULT 'registered',
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (user_id, event_id) -- prevents double-registering
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_checkin (registration_id) -- can't check in twice
);
