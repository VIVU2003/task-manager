import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

const getStoredAuth = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState(getStoredAuth());
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    }),
    [auth.token]
  );

  useEffect(() => {
    if (!auth.token) return;
    loadProjects();
    loadDashboard();
  }, [auth.token]);

  useEffect(() => {
    if (!selectedProjectId || !auth.token) return;
    loadTasks(selectedProjectId);
  }, [selectedProjectId, auth.token]);

  const handleError = async (response) => {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Request failed");
  };

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers });
      if (!res.ok) return handleError(res);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0]._id);
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadTasks = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks?projectId=${projectId}`, { headers });
      if (!res.ok) return handleError(res);
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`, { headers });
      if (!res.ok) return handleError(res);
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onSignup = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      setMessage("Signup successful. Please login.");
      setAuthMode("login");
      form.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onLogin = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setAuth({ token: data.token, user: data.user });
      setMessage(`Welcome ${data.user.name}`);
      form.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onCreateProject = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
    };
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      await loadProjects();
      await loadDashboard();
      setMessage("Project created");
      form.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onAddMember = async (event) => {
    event.preventDefault();
    if (!selectedProjectId) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: formData.get("email"),
      role: formData.get("role"),
    };

    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProjectId}/add-member`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      setMessage("Member added");
      await loadProjects();
      form.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onCreateTask = async (event) => {
    event.preventDefault();
    if (!selectedProjectId) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      projectId: selectedProjectId,
      title: formData.get("title"),
      description: formData.get("description"),
      dueDate: formData.get("dueDate") || null,
    };

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      setMessage("Task created");
      await loadTasks(selectedProjectId);
      await loadDashboard();
      form.reset();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const onTaskStatusChange = async (taskId, status) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return handleError(res);
      await loadTasks(selectedProjectId);
      await loadDashboard();
      setMessage("Task updated");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
    setProjects([]);
    setTasks([]);
    setDashboard(null);
    setSelectedProjectId("");
    setMessage("Logged out");
  };

  if (!auth.token) {
    return (
      <main className="container auth">
        <h1>Task Manager</h1>
        <p>Assignment-ready app with role based access (Admin/Member).</p>
        <div className="tabs">
          <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
            Login
          </button>
          <button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>
            Signup
          </button>
        </div>

        {authMode === "login" ? (
          <form onSubmit={onLogin} className="card form">
            <h2>Login</h2>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
        ) : (
          <form onSubmit={onSignup} className="card form">
            <h2>Signup</h2>
            <input name="name" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Create account</button>
          </form>
        )}
        {message && <p className="message">{message}</p>}
      </main>
    );
  }

  const selectedProject = projects.find((project) => project._id === selectedProjectId);
  const selectedProjectMembership = selectedProject?.members?.find(
    (member) => (member.userId?._id || member.userId) === auth.user?.id
  );
  const isProjectAdmin = selectedProjectMembership?.role === "ADMIN";
  const isAdminAnywhere = projects.some((project) =>
    project.members?.some(
      (member) =>
        (member.userId?._id || member.userId) === auth.user?.id &&
        member.role === "ADMIN"
    )
  );

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>Task Manager Dashboard</h1>
          <p>Logged in as {auth.user?.name}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      {message && <p className="message">{message}</p>}

      <section className="grid">
        <div className="card">
          <h2>Create Project</h2>
          {isAdminAnywhere ? (
            <form onSubmit={onCreateProject} className="form">
              <input name="name" placeholder="Project name" required />
              <textarea name="description" placeholder="Description" rows={3} />
              <button type="submit">Create</button>
            </form>
          ) : (
            <p>Only admins can create projects.</p>
          )}
        </div>

        <div className="card">
          <h2>Projects</h2>
          <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          {selectedProject && (
            <>
              <p>{selectedProject.description}</p>
              <h3>Members</h3>
              <ul>
                {selectedProject.members?.map((member) => (
                  <li key={member.userId?._id || member.userId}>
                    {member.userId?.name || "Unknown"} ({member.role})
                  </li>
                ))}
              </ul>
            </>
          )}
          {isProjectAdmin ? (
            <form onSubmit={onAddMember} className="form small-gap">
              <h3>Add Member (Admin)</h3>
              <input name="email" type="email" placeholder="User email" required />
              <select name="role" defaultValue="MEMBER">
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button type="submit" disabled={!selectedProjectId}>
                Add member
              </button>
            </form>
          ) : (
            selectedProjectId && <p>Only project admins can add members.</p>
          )}
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Create Task</h2>
          {isProjectAdmin ? (
            <form onSubmit={onCreateTask} className="form">
              <input name="title" placeholder="Task title" required />
              <textarea name="description" rows={2} placeholder="Task description" />
              <input name="dueDate" type="date" />
              <button type="submit" disabled={!selectedProjectId}>
                Create task
              </button>
            </form>
          ) : (
            <p>Select a project where you are admin to create tasks.</p>
          )}
        </div>

        <div className="card">
          <h2>Tasks</h2>
          {!selectedProjectId ? (
            <p>Select a project to view tasks.</p>
          ) : (
            <ul>
              {tasks.map((task) => (
                <li key={task._id} className="task-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.description || "No description"}</p>
                    <small>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</small>
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => onTaskStatusChange(task._id, e.target.value)}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Dashboard</h2>
        {!dashboard ? (
          <p>No dashboard data yet.</p>
        ) : (
          <div className="dashboard">
            <p>Projects: {dashboard.projectCount}</p>
            <p>Total tasks: {dashboard.taskCounts?.TOTAL || 0}</p>
            <p>TODO: {dashboard.taskCounts?.TODO || 0}</p>
            <p>In Progress: {dashboard.taskCounts?.IN_PROGRESS || 0}</p>
            <p>Done: {dashboard.taskCounts?.DONE || 0}</p>
            <h3>Overdue Tasks</h3>
            <ul>
              {(dashboard.overdueTasks || []).map((task) => (
                <li key={task._id}>{task.title}</li>
              ))}
              {!dashboard.overdueTasks?.length && <li>None</li>}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
