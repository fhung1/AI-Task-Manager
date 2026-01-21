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
