# 🚀 Task Manager (Assignment Project)

A full-stack task management application with role-based access control (ADMIN / MEMBER). Users can create projects, assign tasks, and track progress through a clean dashboard.

---

## 🔗 Live Demo

* 🌐 Live URL: https://task-manager-omega-self.vercel.app/
* 📂 GitHub Repo: https://github.com/VIVU2003/task-manager

---

## 🧱 Tech Stack

* **Frontend:** React + Vite
* **Backend:** Node.js + Express
* **Database:** MongoDB (Mongoose)
* **Authentication:** JWT + bcrypt

---

## ✨ Features

* 🔐 User authentication (Signup/Login)
* 👥 Role-based access (Admin / Member)
* 📁 Project creation and management
* 👤 Add members to projects (Admin only)
* ✅ Task creation, assignment, and status updates
* 📊 Dashboard with:

  * Total tasks
  * Completed tasks
  * Pending tasks
  * Overdue tasks

---

## 🔑 Role-Based Access (RBAC)

### 👑 Admin

* Create projects (admin users only)
* Add members
* Create and assign tasks
* Full control over project actions

### 👤 Member

* View project tasks
* Update task status only

---

## 📦 Folder Structure

```text
backend/    → Express API
frontend/   → React application
```

---

## ⚙️ Backend Setup

1. Create `.env` file:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
PORT=5001
```

2. Install & run:

```bash
npm install --prefix backend
npm run dev --prefix backend
```

Backend runs on: http://localhost:5001

---

## 💻 Frontend Setup

1. Create `.env` file:

```env
VITE_API_URL=http://localhost:5001
```

2. Install & run:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

Frontend runs on: http://localhost:5173

---

## 🔗 API Overview

### Auth

* `POST /auth/signup`
* `POST /auth/login`

### Projects

* `POST /projects` (Admin only)
* `GET /projects`
* `PATCH /projects/:id/add-member` (Admin only)

### Tasks

* `POST /tasks` (Admin only)
* `GET /tasks?projectId=<id>`
* `PATCH /tasks/:id` (update status)

### Dashboard

* `GET /dashboard`

---

## 📊 Dashboard Logic

* **Total Tasks:** All tasks in project
* **Completed:** status = DONE
* **Pending:** status != DONE
* **Overdue:** dueDate < today AND status != DONE

---

## 🚀 Deployment

* Backend deployed on Railway
* Database hosted on MongoDB Atlas
* Frontend deployed on Vercel

---

## 🎥 Demo Flow

1. Signup/Login
2. Create a project (Admin)
3. Add a member
4. Create and assign tasks
5. Member updates task status
6. Show dashboard updates
7. Show role restriction (Member cannot create project)

---

## 🧠 Notes

* Simplified member management (no invite system)
* Focused on clean architecture and core functionality
* Designed for fast development and clarity

---

## 📬 Contact

If needed, feel free to reach out!

