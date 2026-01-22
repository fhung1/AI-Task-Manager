export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority_score: number;
  created_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
}

export interface UserRegister {
  username: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
