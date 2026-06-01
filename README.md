# Medication Reminder & Health Tracker

A full-stack MERN web application for patients to manage medications, appointments, and health metrics—with caregiver access, adherence reports, and privacy-focused design.

## Features

- **Authentication**: JWT login/signup, bcrypt passwords, Patient & Caregiver roles
- **Medications**: CRUD, scheduled reminders (cron), mark taken/missed, dose logs
- **Appointments**: Calendar view (react-big-calendar), upcoming reminders
- **Health tracker**: BP, sugar, weight, notes with Recharts trends
- **Caregivers**: Email invite, view patient data, adherence monitoring
- **Reports**: Analytics dashboard, CSV/PDF export
- **Notifications**: In-app alerts + optional email (SMTP)
- **UI**: Tailwind, dark mode, responsive layout, PWA support

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind, Recharts  |
| Backend  | Node.js, Express, Mongoose          |
| Database | MongoDB                             |
| Auth     | JWT, bcryptjs                       |

## Project Structure

```
medication-health-tracker/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
├── server/          # Express API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally or MongoDB Atlas URI

## Setup

### 1. Clone / open project

```bash
cd medication-health-tracker
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

Server runs at **http://localhost:5000**

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173** (proxies `/api` to backend)

### 4. Environment variables

**Server (`server/.env`)**

| Variable      | Description                    |
|---------------|--------------------------------|
| PORT          | API port (default 5000)        |
| MONGODB_URI   | MongoDB connection string      |
| JWT_SECRET    | Secret for signing tokens      |
| CLIENT_URL    | Frontend URL for CORS/invites  |
| SMTP_*        | Optional email reminders       |

**Client (optional `client/.env`)**

```
VITE_API_URL=http://localhost:5000/api
```

## Usage

1. **Register** as Patient or Caregiver
2. **Patient**: Add medicines with reminder times, log vitals, book appointments
3. **Invite caregiver** from Caregivers page (they register/login and open invite link)
4. **Caregiver**: Select patient from sidebar, view medicines/logs/reports
5. **Reports**: Export CSV/PDF, view adherence %

## API Overview

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/register          | Register                 |
| POST   | /api/auth/login             | Login                    |
| GET    | /api/medications/today      | Today's medicines        |
| POST   | /api/medications/:id/dose   | Log taken/missed         |
| GET    | /api/appointments           | List appointments        |
| GET    | /api/health-logs            | Health logs              |
| POST   | /api/caregivers/invite      | Invite caregiver         |
| GET    | /api/reports/analytics      | Adherence stats          |
| GET    | /api/reports/export/csv     | Export CSV               |

All protected routes require header: `Authorization: Bearer <token>`

Caregivers pass `?patientId=<id>` on read endpoints.

## Scheduler

A cron job runs **every minute** to:

- Create pending dose logs and in-app/email reminders at scheduled times
- Mark doses as missed after 30 minutes
- Send appointment reminders ~24 hours before

## Production Build

```bash
# Frontend
cd client && npm run build

# Serve API and static files (configure reverse proxy or serve client/dist)
cd server && npm start
```

Set strong `JWT_SECRET`, use HTTPS, and MongoDB Atlas in production.

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT stored in localStorage (consider httpOnly cookies for production hardening)
- Role-based access on all patient data routes
- Caregivers limited to linked patients only
- No passwords returned from API

## License

MIT — use freely for learning and personal projects.
