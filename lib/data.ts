import { clearSession, getSession } from "@/lib/session";
import { checkDeviceSubscription } from "@/lib/subscription";
import { supabaseServer } from "@/lib/supabase";
import type { Task, TeamMember } from "@/lib/types";

export async function purgeExpiredCompletedTasks(deviceId?: string) {
  const db = supabaseServer(deviceId);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let query = db
    .from("tasks")
    .delete()
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .lte("completed_at", cutoff);

  if (deviceId) {
    query = query.eq("device_id", deviceId);
  }

  await query;
}

export async function loadDesk() {
  const session = await getSession();
  if (!session) return null;

  const sub = await checkDeviceSubscription(session.deviceId);
  if (!sub.isActive) {
    await clearSession();
    return null;
  }

  // 1. Purge completed tasks older than 24h from database
  await purgeExpiredCompletedTasks(session.deviceId);

  const db = supabaseServer(session.deviceId);
  const [tasks, members] = await Promise.all([
    db
      .from("tasks")
      .select(
        "id, title, description, status, priority, deadline_date, deadline_time, assigned_to, assigned_member_id, client_name, case_title, source, completed_at, created_at, updated_at",
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

  // 2. Safety filter in memory: exclude completed tasks > 24 hours
  const now = Date.now();
  const validTasks = ((tasks.data ?? []) as Task[]).filter((task) => {
    if (task.status === "completed" && task.completed_at) {
      const completedTime = new Date(task.completed_at).getTime();
      if (!Number.isNaN(completedTime) && now - completedTime >= 24 * 60 * 60 * 1000) {
        return false;
      }
    }
    return true;
  });

  return {
    session,
    tasks: validTasks,
    members: (members.data ?? []) as TeamMember[],
  };
}
