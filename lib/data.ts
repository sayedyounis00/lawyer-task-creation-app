import { getSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import type { Task, TeamMember } from "@/lib/types";

export async function loadDesk() {
  const session = await getSession();
  if (!session) return null;

  const db = supabaseServer();
  const [tasks, members] = await Promise.all([
    db
      .from("tasks")
      .select(
        "id, title, description, status, priority, deadline_date, deadline_time, assigned_to, assigned_member_id, client_name, case_title, source, created_at, updated_at",
      )
      .eq("device_id", session.deviceId)
      .order("created_at", { ascending: false }),
    db
      .from("team_members")
      .select(
        "id, device_id, local_user_id, name, username, role_id, role_name, department, position, phone, email, status",
      )
      .eq("device_id", session.deviceId)
      .order("name", { ascending: true }),
  ]);

  if (tasks.error) throw new Error(tasks.error.message);
  if (members.error) throw new Error(members.error.message);

  return {
    session,
    tasks: (tasks.data ?? []) as Task[],
    members: (members.data ?? []) as TeamMember[],
  };
}
