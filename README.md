# Cohort-ArkoRoyChowdhury-25E103A52

A full-stack user management application with a React frontend and an Express + PostgreSQL backend.

## Project Description

This project provides a simple registration-driven user workflow. It includes:
- A frontend form to register users
- A backend REST API to create, fetch, authenticate, update, and delete users
- Automatic database table initialization for the `users` table on server startup

The repository appears to be structured as a cohort/assignment project focused on full-stack fundamentals (form handling, REST APIs, and relational database operations).

## Features

- User registration from a React UI
- Backend CRUD-style profile operations
- Login credential verification endpoint
- PostgreSQL-backed persistence
- Input constraints at database level (registration number length, password length, age range)
- CORS-enabled local frontend/backend communication

## Tech Stack

### Frontend
- React
- Vite
- Axios
- ESLint

### Backend
- Node.js
- Express
- PostgreSQL (`pg`)
- `dotenv`
- `cors`

## Project Structure

```text
.
├── backend
│   ├── controllers
│   │   └── initdb.js
│   ├── models
│   │   └── connection.js
│   ├── package.json
│   └── server.js
├── frontend
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   │   └── RegisterForm.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (LTS recommended)
- npm
- PostgreSQL (running locally or remotely, accessible via standard `pg` env vars)

## Installation

Clone and install dependencies for both apps:

```bash
git clone https://github.com/Max-Rex-2006/Cohort-ArkoRoyChowdhury-25E103A52.git
cd Cohort-ArkoRoyChowdhury-25E103A52

cd backend
npm install

cd ../frontend
npm install
```

## Configuration / Environment Variables

Backend uses `dotenv` and reads:

- `PORT` (required): backend server port (frontend expects backend at `http://localhost:3001` by default)

Database connection is managed by `pg.Pool` and supports standard PostgreSQL environment variables such as:

- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

Create a `backend/.env` file (example):

```env
PORT=3001
PGHOST=localhost
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database
```

## How to Run Locally

### 1) Start Backend

```bash
cd backend
node server.js
```

Backend starts on `PORT` and initializes the `users` table if it does not exist.

### 2) Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on Vite default (`http://localhost:5173`) and calls backend endpoint `http://localhost:3001/user` for registration.

## Usage

- Open the frontend in your browser (`http://localhost:5173`)
- Fill in the registration form (name, registration number, email, password, age)
- Submit to create a user in PostgreSQL

### Available Backend Endpoints

- `GET /` — health/welcome check
- `GET /users` — fetch all users
- `POST /user` — create user
- `POST /login` — verify credentials
- `PATCH /profile` — update email/password/age (requires current credentials)
- `DELETE /profile` — delete account (requires credentials)

## Scripts / Commands

### Frontend (`frontend/package.json`)

- `npm run dev` — run Vite dev server
- `npm run build` — create production build
- `npm run lint` — lint frontend code
- `npm run preview` — preview production build

### Backend (`backend/package.json`)

- `npm test` — currently placeholder script (`"Error: no test specified"`)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make focused, reviewable changes
4. Run relevant checks locally
5. Open a pull request with a clear description

## License

No license file is currently present in this repository.

## Author / Credits

- Repository owner: [Max-Rex-2006](https://github.com/Max-Rex-2006)
- Project/cohort attribution: Arko Roy Chowdhury
