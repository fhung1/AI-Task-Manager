import type { Task, TaskCreate, UserRegister, UserLogin, TokenResponse } from "./types";

const API_BASE_URL = "http://localhost:8000/api";

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function register(user: UserRegister): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      let errorMessage = "Failed to register";
      try {
        const error = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch {
        errorMessage = `Server returned ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    await response.json();
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Cannot connect to server. Make sure the backend is running on http://localhost:8000");
    }
    throw err;
  }
}

export async function login(user: UserLogin): Promise<TokenResponse> {
  const formData = new FormData();
  formData.append("username", user.username);
  formData.append("password", user.password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to login");
  }
  return response.json();
}

export function logout(): void {
  localStorage.removeItem("access_token");
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error("Unauthorized. Please login again.");
    }
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

export async function createTask(task: TaskCreate): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error("Unauthorized. Please login again.");
    }
    throw new Error("Failed to create task");
  }
  return response.json();
}

export async function deleteTask(taskId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error("Unauthorized. Please login again.");
    }
    throw new Error("Failed to delete task");
  }
}
