// server.js
// Entry point for Part B. Merge this with your teammates' server.js —
// each of you mounts your own routes onto one shared Express app.

const express = require('express');
require('dotenv').config();

const registrationRoutes = require('./routes/registrations');
const attendanceRoutes = require('./routes/attendance');

const app = express();
app.use(express.json());

app.use('/registrations', registrationRoutes);
app.use('/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('Part B API (Registration + Attendance + QR) is running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Part B server running on http://localhost:${PORT}`);
});
