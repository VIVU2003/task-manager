# Task Manager (Assignment Project)

Full stack task manager with role-based access (`ADMIN` / `MEMBER`), built using:
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React + Vite
- Auth: JWT + bcrypt

## Features

- Authentication (`/auth/signup`, `/auth/login`)
- Project creation and listing (`POST /projects`, `GET /projects`)
- Add project member by email (Admin only, simplified flow)
- Task creation, listing, and update (`POST /tasks`, `GET /tasks`, `PATCH /tasks/:id`)
- Dashboard summary (`GET /dashboard`) with counts and overdue tasks

## Folder Structure

- `backend/` - API server
- `frontend/` - React app

## Backend Setup

1. Create env file:
   - Copy `backend/.env.example` to `backend/.env`
2. Fill values:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (optional, default `5000`)
3. Install and run:

```bash
npm install --prefix backend
npm run dev --prefix backend
```

Backend runs on `http://localhost:5000`.

## Frontend Setup

1. Create env file:
   - Copy `frontend/.env.example` to `frontend/.env`
2. Install and run:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

Frontend runs on `http://localhost:5173`.

## API Overview

### Auth
- `POST /auth/signup`
- `POST /auth/login`

### Projects
- `POST /projects` (JWT required)
- `GET /projects` (JWT required)
- `PATCH /projects/:id/add-member` (JWT required, Admin only)

### Tasks
- `POST /tasks` (JWT required)
- `GET /tasks?projectId=<id>` (JWT required)
- `PATCH /tasks/:id` (JWT required)

### Dashboard
- `GET /dashboard` (JWT required)

## Role Logic

- Project creator is `ADMIN`
- Members are stored per project
- Admin can add members and assign/reassign tasks
- Members can view project/tasks and update task status

## Railway Deployment (Simple)

1. Push code to GitHub repository.
2. Create new Railway project and connect the GitHub repo.
3. Add environment variables in Railway:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (optional)
4. Set service root to `backend` and start command:
   - `npm start`
5. Deploy and verify API health at `/health`.
6. Deploy frontend (Vercel/Netlify/Railway static) and set `VITE_API_URL` to backend public URL.

## Submission Checklist

- Live URL
- GitHub repo
- README
- 2-5 minute demo video
