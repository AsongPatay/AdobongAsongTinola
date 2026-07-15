# Part B — Registration + Attendance + QR Check-in

## What's in here
```
part-b-registration-attendance/
├── config/db.js          → MySQL connection pool
├── middleware/auth.js    → JWT verification (sync JWT_SECRET with Auth teammate)
├── routes/registrations.js → sign up, cancel, view, generate QR
├── routes/attendance.js  → scan QR to check in, view attendance list
├── sql/schema.sql        → registrations + attendance tables
├── server.js             → entry point, mounts the routes
├── package.json
└── .env.example
```

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in real values
3. Run `sql/schema.sql` in MySQL **after** the `users` and `events` tables already exist (they belong to teammates on Auth and Event Management)
4. `npm run dev` to start with auto-reload, or `npm start`

## Endpoints

| Method | Route | Auth required | Purpose |
|---|---|---|---|
| POST | `/registrations` | Yes (any logged-in user) | Register for an event, returns a `qr_code` |
| GET | `/registrations/qr/:code` | No | Returns the QR code as a PNG image |
| GET | `/registrations/my` | Yes | View your own registrations |
| GET | `/registrations/event/:eventId` | Yes (admin) | View everyone registered for an event |
| DELETE | `/registrations/:id` | Yes | Cancel your own registration |
| POST | `/attendance/checkin` | Yes (admin) | Scan a QR code to mark someone present |
| GET | `/attendance/event/:eventId` | Yes (admin) | View who actually checked in |

## How this connects to teammates' parts
- **Auth teammate**: `middleware/auth.js` must use the same `JWT_SECRET` as their login code, or tokens won't verify here. Confirm this before merging.
- **Event Management teammate**: registration checks that `event_id` exists in their `events` table — this repo assumes that table is already there.
- **Dashboard/Certificates teammate**: they'll likely query the `attendance` table directly to show stats and to know who's eligible for a certificate.

## Testing standalone (before merging with teammates)
If the `events` or `users` tables aren't ready yet, you can still test this part on its own:
1. Manually insert one row into `users` and one into `events` directly in MySQL so the foreign keys have something to point to
2. Use Postman to hit `POST /registrations` with a fake JWT (or temporarily comment out `verifyToken` while testing solo, then re-enable before merging)
