"use server";

import { revalidatePath } from "next/cache";
import { passwordsMatch, clearSession, getSession, setSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase";
import type { ActionState } from "@/lib/types";

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullable(value: string) {
  return value.length > 0 ? value : null;
}

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Sign in with your device ID first.");
  return session;
}

export async function signIn(_prev: ActionState, form: FormData): Promise<ActionState> {
  const deviceId = field(form, "deviceId");
  const password = field(form, "password");
  if (!deviceId || !password) {
    return { ok: false, message: "Enter the device ID and admin password." };
  }

  const { data, error } = await supabaseServer()
    .from("device_managers")
    .select("device_id, name, password")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data || !passwordsMatch(data.password, password)) {
    return { ok: false, message: "That device ID and password do not match." };
  }

  await setSession({
    deviceId: data.device_id,
    officeName: data.name || "Office",
  });
  return { ok: true, message: "Signed in." };
}

export async function signOut() {
  await clearSession();
}

export async function saveTask(_prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await requireSession();
  const id = field(form, "id");
  const title = field(form, "title");
  if (!title) return { ok: false, message: "A task needs a title." };

  const assignedMemberId = nullable(field(form, "assignedMemberId"));
  if (!assignedMemberId) {
    return { ok: false, message: "Please assign this task to a team member." };
  }

  const { data: member, error: memberErr } = await supabaseServer()
    .from("team_members")
    .select("id, name, device_id")
    .eq("id", assignedMemberId)
    .eq("device_id", session.deviceId)
    .maybeSingle();

  if (memberErr) return { ok: false, message: memberErr.message };
  if (!member) return { ok: false, message: "Choose a valid team member from this office." };
  const assignedTo = member.name;

  const row = {
    title,
    description: nullable(field(form, "description")),
    status: field(form, "status") || "pending_review",
    priority: field(form, "priority") || "medium",
    deadline_date: nullable(field(form, "deadlineDate")),
    deadline_time: nullable(field(form, "deadlineTime")),
    assigned_member_id: assignedMemberId,
    assigned_to: assignedTo,
    client_name: nullable(field(form, "clientName")),
    case_title: nullable(field(form, "caseTitle")),
    device_id: session.deviceId,
    source: "admin_app",
    updated_at: new Date().toISOString(),
  };

  const db = supabaseServer();
  const result = id
    ? await db.from("tasks").update(row).eq("id", id).eq("device_id", session.deviceId)
    : await db.from("tasks").insert(row);

  if (result.error) return { ok: false, message: result.error.message };
  revalidatePath("/");
  return { ok: true, message: id ? "Task updated." : "Task saved." };
}

export async function deleteTask(form: FormData): Promise<ActionState> {
  const session = await requireSession();
  const id = field(form, "id");
  if (!id) return { ok: false, message: "Missing task." };
  const { error } = await supabaseServer()
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("device_id", session.deviceId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true, message: "Task deleted." };
}

export async function updateTaskStatus(id: string, newStatus: string): Promise<ActionState> {
  const session = await requireSession();
  if (!id || !newStatus) return { ok: false, message: "Invalid request." };
  const { error } = await supabaseServer()
    .from("tasks")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("device_id", session.deviceId);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true, message: "Status updated." };
}

export async function addMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await requireSession();
  const name = field(form, "name");
  const username = field(form, "username");
  const roleName = field(form, "roleName") || "Team member";
  if (!name || !username) {
    return { ok: false, message: "Name and username are required." };
  }

  const roleId =
    field(form, "roleId") ||
    `role_${roleName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "staff"}`;

  const { error } = await supabaseServer().from("team_members").insert({
    device_id: session.deviceId,
    local_user_id: `usr_${Date.now()}`,
    name,
    username,
    role_id: roleId,
    role_name: roleName,
    department: nullable(field(form, "department")),
    position: nullable(field(form, "position")),
    phone: nullable(field(form, "phone")),
    email: nullable(field(form, "email")),
    status: "active",
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true, message: "Team member added." };
}
