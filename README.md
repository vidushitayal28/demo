# FLEXI Mood Tracker

A full-stack mood tracker built with React + Vite, Node.js, Express, and MongoDB/Mongoose. This version includes sign up, sign in, JWT authentication, and per-user mood privacy.

## Features
- Responsive sign-in and sign-up screens
- Passwords hashed with bcryptjs (passwords are never stored in plain text)
- JWT-protected API routes
- Each account can only read, update, and delete its own mood entries
- Mood logging, mood history, and weekly analytics
- MongoDB persistence

## Requirements
- Node.js 18+
- npm
- MongoDB Community Server running locally, or a MongoDB Atlas URI
- MongoDB Compass is optional; it lets you inspect the database.

## Setup

1. Extract this ZIP and open the `FLEXI-MOOD-TRACKER` folder in VS Code.
2. Open a terminal in the project root (the folder containing the root `package.json`).
3. Install all dependencies:

   ```bash
   npm run install:all
   ```

4. Create `server/.env` by copying `server/.env.example`. On Windows PowerShell, run:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

5. Open `server/.env` and set a private JWT secret of at least 32 characters. Generate one in PowerShell with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Copy the generated value after `JWT_SECRET=` in `server/.env`. Keep this file private and do not commit it.

   Local default configuration:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/flexi_mood_tracker
   CLIENT_ORIGIN=http://localhost:5173
   JWT_SECRET=replace_with_your_own_random_secret
   ```

   The value shown for `JWT_SECRET` above is a placeholder, not a secure secret. Replace it.

6. Ensure MongoDB Server is running. MongoDB Compass is only a database GUI; it does not itself provide the MongoDB Server process.
7. Start both the backend and frontend from the project root:

   ```bash
   npm run dev
   ```

8. Open the Vite URL printed in the terminal, usually `http://localhost:5173`. Create an account on the sign-up tab, then sign in.

## Run apps separately

From the project root, use two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Backend health endpoint: `http://localhost:5000/api/health`

## Authentication API
- `POST /api/auth/register` — body: `{ "name": "Your Name", "email": "you@example.com", "password": "at-least-8-characters" }`
- `POST /api/auth/login` — body: `{ "email": "you@example.com", "password": "your-password" }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`

The browser stores the JWT in local storage for this development starter. For higher-security production deployments, consider secure, HttpOnly cookies, HTTPS, rate limiting, password reset flows, email verification, and a review of privacy/security requirements.

## Mood API (authentication required)
- `POST /api/moods` — create a mood entry
- `GET /api/moods?limit=50&mood=Happy` — list your entries
- `GET /api/moods/:id` — get your entry
- `PUT /api/moods/:id` — update your entry
- `DELETE /api/moods/:id` — delete your entry
- `GET /api/analytics/weekly` — your mood counts and intensity for the last seven days

## Note about existing data
Mood entries created before user authentication have no owner. This version intentionally does not expose those legacy entries to signed-in users. If you need to preserve old entries, they must be assigned to the appropriate account deliberately before use.
