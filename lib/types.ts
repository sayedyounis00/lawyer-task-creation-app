export type TaskStatus =
  | "pending_review"
  | "in_progress"
  | "completed"
  | "rejected";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline_date: string | null;
  deadline_time: string | null;
  assigned_to: string | null;
  assigned_member_id: string | null;
  client_name: string | null;
  case_title: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  device_id: string;
  local_user_id: string;
  name: string;
  username: string;
  role_id: string;
  role_name: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  status: string;
};

export type Session = {
  deviceId: string;
  officeName: string;
};

export type ActionState = {
  ok: boolean;
  message: string;
};
