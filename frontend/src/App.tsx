import { useState, useEffect } from "react";
import type { Task, TaskCreate, UserLogin, UserRegister } from "./types";
import { fetchTasks, createTask, deleteTask, login, register, logout, isAuthenticated } from "./api";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    if (auth) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      if (err instanceof Error && err.message.includes("Unauthorized")) {
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError(null);
      const loginData: UserLogin = {
        username: username.trim(),
        password: password,
      };
      const tokenResponse = await login(loginData);
      localStorage.setItem("access_token", tokenResponse.access_token);
      setAuthenticated(true);
      setUsername("");
      setPassword("");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError(null);
      const registerData: UserRegister = {
        username: username.trim(),
        password: password,
      };
      await register(registerData);
      const loginData: UserLogin = {
        username: username.trim(),
        password: password,
      };
      const tokenResponse = await login(loginData);
      localStorage.setItem("access_token", tokenResponse.access_token);
      setAuthenticated(true);
      setUsername("");
      setPassword("");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    }
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setTasks([]);
    setUsername("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setError(null);
      const newTask: TaskCreate = {
        title: title.trim(),
        description: description.trim() || null,
      };
      const created = await createTask(newTask);
      setTasks([...tasks, created]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      if (err instanceof Error && err.message.includes("Unauthorized")) {
        setAuthenticated(false);
      }
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      setError(null);
      await deleteTask(taskId);
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      if (err instanceof Error && err.message.includes("Unauthorized")) {
        setAuthenticated(false);
      }
    }
  };

  const formatPriority = (score: number): string => {
    if (score >= 0.7) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
  };

  const getPriorityColor = (score: number): string => {
    if (score >= 0.7) return "#ef4444";
    if (score >= 0.4) return "#f59e0b";
    return "#10b981";
  };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ marginBottom: "2rem", textAlign: "center" }}>AI Task Manager</h1>
        
        {!showRegister ? (
          <div>
            <h2 style={{ marginBottom: "1rem" }}>Login</h2>
            <form onSubmit={handleLogin} style={{ marginBottom: "1rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem",
                  fontSize: "1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "1rem",
                }}
              >
                Login
              </button>
            </form>
            <p style={{ textAlign: "center" }}>
              Don't have an account?{" "}
              <button
                onClick={() => setShowRegister(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Register
              </button>
            </p>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: "1rem" }}>Register</h2>
            <form onSubmit={handleRegister} style={{ marginBottom: "1rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem",
                  fontSize: "1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "1rem",
                }}
              >
                Register
              </button>
            </form>
            <p style={{ textAlign: "center" }}>
              Already have an account?{" "}
              <button
                onClick={() => setShowRegister(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Login
              </button>
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              borderRadius: "4px",
              marginTop: "1rem",
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>AI Task Manager</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "0.5rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create Task
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading tasks...</div>
      ) : (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p>No tasks yet. Create one above!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: "1rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.25rem", flex: 1 }}>{task.title}</h3>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          backgroundColor: getPriorityColor(task.priority_score) + "20",
                          color: getPriorityColor(task.priority_score),
                        }}
                      >
                        {formatPriority(task.priority_score)} ({task.priority_score.toFixed(2)})
                      </span>
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          fontSize: "0.875rem",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p style={{ margin: "0.5rem 0", color: "#6b7280" }}>
                      {task.description}
                    </p>
                  )}
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#9ca3af" }}>
                    Created: {new Date(task.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
