import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

const getStoredAuth = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
};

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return "dark";
  });
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState(getStoredAuth());
  const [feedback, setFeedback] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [activePanel, setActivePanel] = useState("dashboard");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [taskFilter, setTaskFilter] = useState("ALL");
  const [loading, setLoading] = useState({
    projects: false,
    tasks: false,
    dashboard: false,
    auth: false,
  });

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    }),
    [auth.token]
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!auth.token) return;
    loadProjects();
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token]);

  useEffect(() => {
    if (!selectedProjectId || !auth.token) return;
    loadTasks(selectedProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, auth.token]);

  const handleError = async (response) => {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Request failed");
  };

  const setLoadState = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const showFeedback = (type, text) => setFeedback({ type, text });

  const loadProjects = async () => {
    setLoadState("projects", true);
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers });
      if (!res.ok) return handleError(res);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0]._id);
      }
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoadState("projects", false);
    }
  };

  const loadTasks = async (projectId) => {
    setLoadState("tasks", true);
    try {
      const res = await fetch(`${API_BASE}/tasks?projectId=${projectId}`, { headers });
      if (!res.ok) return handleError(res);
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoadState("tasks", false);
    }
  };

  const loadDashboard = async () => {
    setLoadState("dashboard", true);
    try {
      const res = await fetch(`${API_BASE}/dashboard`, { headers });
      if (!res.ok) return handleError(res);
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoadState("dashboard", false);
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

    setLoadState("auth", true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return handleError(res);
      showFeedback("success", "Signup successful. Please login.");
      setAuthMode("login");
      form.reset();
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoadState("auth", false);
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

    setLoadState("auth", true);
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
      showFeedback("success", `Welcome back, ${data.user.name}`);
      form.reset();
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoadState("auth", false);
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
      showFeedback("success", "Project created.");
      form.reset();
    } catch (error) {
      showFeedback("error", error.message);
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
      showFeedback("success", "Member added.");
      await loadProjects();
      form.reset();
    } catch (error) {
      showFeedback("error", error.message);
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
      showFeedback("success", "Task created.");
      await loadTasks(selectedProjectId);
      await loadDashboard();
      form.reset();
    } catch (error) {
      showFeedback("error", error.message);
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
      showFeedback("success", "Task status updated.");
    } catch (error) {
      showFeedback("error", error.message);
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
    showFeedback("info", "Logged out.");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (!auth.token) {
    return (
      <main className="auth-shell">
        <section className="auth-visual">
          <div className="auth-brand">TASK MGR.</div>
          <div className="auth-mockup">
            <div className="mockup-sidebar" />
            <div className="mockup-cards">
              <div className="mock-card" />
              <div className="mock-card" />
              <div className="mock-card" />
              <div className="mock-card" />
            </div>
          </div>
          <blockquote className="auth-quote">
            "Organize projects, assign tasks, and track progress with ease."
          </blockquote>
        </section>
        <section className="auth-form-panel">
          <div className="auth-card">
          <div className="tabs">
            <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
              Login
            </button>
            <button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>
              Signup
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={onLogin} className="form">
              <h2>Welcome back</h2>
              <label>Email</label>
              <input name="email" type="email" placeholder="you@example.com" required />
              <label>Password</label>
              <input name="password" type="password" placeholder="Enter password" required />
              <button type="submit" disabled={loading.auth}>
                {loading.auth ? "Signing in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={onSignup} className="form">
              <h2>Create account</h2>
              <label>Name</label>
              <input name="name" placeholder="Your name" required />
              <label>Email</label>
              <input name="email" type="email" placeholder="you@example.com" required />
              <label>Password</label>
              <input name="password" type="password" placeholder="Create password" required />
              <button type="submit" disabled={loading.auth}>
                {loading.auth ? "Creating..." : "Signup"}
              </button>
            </form>
          )}
          {feedback && (
            <div className={`feedback feedback-${feedback.type}`}>
              <span>{feedback.text}</span>
              <button className="dismiss-btn" onClick={() => setFeedback(null)}>
                x
              </button>
            </div>
          )}
          </div>
        </section>
      </main>
    );
  }

  const selectedProject = projects.find((project) => project._id === selectedProjectId);
  const selectedProjectMembership = selectedProject?.members?.find(
    (member) => (member.userId?._id || member.userId) === auth.user?.id
  );
  const isProjectAdmin = selectedProjectMembership?.role === "ADMIN";
  const activeRole = selectedProjectMembership?.role || "MEMBER";
  const isAdminAnywhere = projects.some((project) =>
    project.members?.some(
      (member) =>
        (member.userId?._id || member.userId) === auth.user?.id &&
        member.role === "ADMIN"
    )
  );
  const getStatusClass = (status) =>
    status === "IN_PROGRESS" ? "IN_PROGRESS" : status === "DONE" ? "DONE" : "TODO";
  const filteredTasks = tasks.filter((task) => (taskFilter === "ALL" ? true : task.status === taskFilter));

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-caption">Team Workspace</p>
          <h1>TASK MGR.</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activePanel === "dashboard" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActivePanel("dashboard")}
          >
            <span className="nav-icon">◫</span>
            <span>Dashboard</span>
          </button>
          <button
            className={activePanel === "projects" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActivePanel("projects")}
          >
            <span className="nav-icon">⌂</span>
            <span>Projects</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <p className="user-name">{auth.user?.name}</p>
          <p className="user-email">{auth.user?.email}</p>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <button
          className="theme-fab"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? "☀" : "◐"}
        </button>
        <header className="main-header">
          <div className="header-row">
            <h2>{activePanel === "dashboard" ? `Welcome back, ${auth.user?.name}` : "Projects"}</h2>
            <span className={`role-badge role-${activeRole}`}>
              {activeRole === "ADMIN" ? "Admin" : "Member"}
            </span>
          </div>
          <p className="header-subtitle">
            {activePanel === "dashboard"
              ? "Here's an overview of your tasks and projects."
              : "Create projects, manage members, and control ownership from one place."}
          </p>
        </header>

      {feedback && (
        <div className={`feedback feedback-${feedback.type}`}>
          <span>{feedback.text}</span>
          <button className="dismiss-btn" onClick={() => setFeedback(null)}>
            x
          </button>
        </div>
      )}

        <section className="kpi-row">
          <article className="kpi-card">
            <div className="kpi-content">
              <span className="kpi-icon kpi-total">≡</span>
              <div>
                <p>Total Tasks</p>
                <strong>{dashboard?.taskCounts?.TOTAL ?? 0}</strong>
              </div>
            </div>
          </article>
          <article className="kpi-card">
            <div className="kpi-content">
              <span className="kpi-icon kpi-done">✓</span>
              <div>
                <p>Done</p>
                <strong>{dashboard?.taskCounts?.DONE ?? 0}</strong>
              </div>
            </div>
          </article>
          <article className="kpi-card">
            <div className="kpi-content">
              <span className="kpi-icon kpi-progress">◔</span>
              <div>
                <p>In Progress</p>
                <strong>{dashboard?.taskCounts?.IN_PROGRESS ?? 0}</strong>
              </div>
            </div>
          </article>
          <article className="kpi-card">
            <div className="kpi-content">
              <span className="kpi-icon kpi-overdue">!</span>
              <div>
                <p>Overdue</p>
                <strong>{dashboard?.overdueTasks?.length ?? 0}</strong>
              </div>
            </div>
          </article>
          <article className="kpi-card">
            <div className="kpi-content">
              <span className="kpi-icon kpi-projects">□</span>
              <div>
                <p>My Projects</p>
                <strong>{dashboard?.projectCount ?? 0}</strong>
              </div>
            </div>
          </article>
        </section>

        {activePanel === "projects" ? (
          <section className="workspace-grid">
            <div className="workspace-card">
              <div className="section-head">
                <h3>Project Control</h3>
                <p>{loading.projects ? "Loading projects..." : "Select and manage a project."}</p>
              </div>
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {selectedProject ? (
                <div className="project-details">
                  <p>{selectedProject.description || "No description"}</p>
                  <h4>Members</h4>
                  <div className="member-list">
                    {selectedProject.members?.map((member) => (
                      <span className="member-chip" key={member.userId?._id || member.userId}>
                        {member.userId?.name || "Unknown"} - {member.role}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                !loading.projects && <p className="hint">No project selected.</p>
              )}
            </div>

            <div className="workspace-card">
              <div className="section-head">
                <h3>Admin Actions</h3>
                <p>Create projects, add members, and assign ownership.</p>
              </div>
              {isAdminAnywhere ? (
                <form onSubmit={onCreateProject} className="form">
                  <label>Project Name</label>
                  <input name="name" placeholder="Project name" required />
                  <label>Description</label>
                  <textarea name="description" placeholder="Description" rows={3} />
                  <button type="submit">Create Project</button>
                </form>
              ) : (
                <p className="hint">Only admins can create projects.</p>
              )}

              {isProjectAdmin ? (
                <form onSubmit={onAddMember} className="form section-spacing">
                  <h4>Add Member</h4>
                  <label>User Email</label>
                  <input name="email" type="email" placeholder="member@email.com" required />
                  <label>Role</label>
                  <select name="role" defaultValue="MEMBER">
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button type="submit" disabled={!selectedProjectId}>
                    Add Member
                  </button>
                </form>
              ) : (
                selectedProjectId && <p className="hint">Only project admins can add members.</p>
              )}
            </div>
          </section>
        ) : (
          <section className="workspace-stack">
            <div className="workspace-card">
              <div className="section-head table-header">
                <h3>Recent Tasks</h3>
                <div className="table-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setShowFilterMenu((prev) => !prev)}
                  >
                    Filter
                  </button>
                </div>
              </div>
              {showFilterMenu && (
                <div className="filter-panel">
                  <label htmlFor="task-filter">Status</label>
                  <select
                    id="task-filter"
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              )}
              {!selectedProjectId && <p className="hint">Select a project to view tasks.</p>}
              {selectedProjectId && loading.tasks && <p className="hint">Loading task list...</p>}
              {selectedProjectId && !loading.tasks && filteredTasks.length === 0 && (
                <div className="empty-state">
                  <h4>No tasks found.</h4>
                  <p>
                    {tasks.length === 0
                      ? "Ask your admin to create and assign tasks in this project."
                      : "Try changing the filter to view more tasks."}
                  </p>
                </div>
              )}
              {selectedProjectId && !loading.tasks && filteredTasks.length > 0 && (
                <div className="task-table">
                  <div className="task-row task-head">
                    <span>Task</span>
                    <span>Project</span>
                    <span>Due Date</span>
                    <span>Status</span>
                  </div>
                  {filteredTasks.map((task) => (
                    <div key={task._id} className="task-row">
                      <span>{task.title}</span>
                      <span>{task.projectId?.name || selectedProject?.name || "-"}</span>
                      <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</span>
                      <span>
                        <select
                          className={`status-select status-${getStatusClass(task.status)}`}
                          value={task.status}
                          onChange={(e) => onTaskStatusChange(task._id, e.target.value)}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="workspace-grid two-col">
              <div className="workspace-card">
                <div className="section-head">
                  <h3>Create Task</h3>
                  <p>Admin-only task creation for the selected project.</p>
                </div>
                {isProjectAdmin ? (
                  <form onSubmit={onCreateTask} className="form">
                    <label>Task Title</label>
                    <input name="title" placeholder="Task title" required />
                    <label>Description</label>
                    <textarea name="description" rows={2} placeholder="Task description" />
                    <label>Due Date</label>
                    <input name="dueDate" type="date" />
                    <button type="submit" disabled={!selectedProjectId}>
                      Create Task
                    </button>
                  </form>
                ) : (
                  <p className="hint">Select a project where you are admin to create tasks.</p>
                )}
              </div>

              <div className="workspace-card">
                <div className="section-head">
                  <h3>Overdue</h3>
                  <p>Tasks that need immediate attention.</p>
                </div>
                {loading.dashboard ? (
                  <p className="hint">Loading summary...</p>
                ) : !dashboard?.overdueTasks?.length ? (
                  <p className="hint">No overdue tasks.</p>
                ) : (
                  <ul className="overdue-list">
                    {dashboard.overdueTasks.map((task) => (
                      <li key={task._id}>{task.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
