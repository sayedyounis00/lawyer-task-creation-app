"use server";

import { revalidatePath } from "next/cache";
import { purgeExpiredCompletedTasks } from "@/lib/data";
import { passwordsMatch, clearSession, getSession, setSession } from "@/lib/session";
import { checkDeviceSubscription } from "@/lib/subscription";
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
  if (!session) throw new Error("يرجى تسجيل الدخول باستخدام مفتاح الجهاز أولاً.");

  const sub = await checkDeviceSubscription(session.deviceId);
  if (!sub.isActive) {
    await clearSession();
    throw new Error(sub.message || "انتهت صلاحية اشتراك هذا الجهاز. يرجى سداد الاشتراك لتسجيل الدخول.");
  }

  return session;
}

export async function signIn(_prev: ActionState, form: FormData): Promise<ActionState> {
  const deviceId = field(form, "deviceId");
  const password = field(form, "password");
  if (!deviceId || !password) {
    return { ok: false, message: "يرجى إدخال مفتاح الجهاز وكلمة مرور المدير." };
  }

  const { data, error } = await supabaseServer()
    .from("device_managers")
    .select("device_id, name, password")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data || !passwordsMatch(data.password, password)) {
    return { ok: false, message: "مفتاح الجهاز وكلمة المرور غير متطابقين." };
  }

  const sub = await checkDeviceSubscription(deviceId);
  if (!sub.isActive) {
    return {
      ok: false,
      message: sub.message || "اشتراك هذا الجهاز غير سارٍ أو منتهي الصلاحية. يرجى سداد الاشتراك لتسجيل الدخول.",
    };
  }

  await setSession({
    deviceId: data.device_id,
    officeName: data.name || "مكتب المحاماة",
  });
  return { ok: true, message: "تم تسجيل الدخول بنجاح." };
}

export async function signOut() {
  await clearSession();
}

export async function saveTask(_prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await requireSession();
  const id = field(form, "id");
  const title = field(form, "title");
  if (!title) return { ok: false, message: "عنوان المهمة مطلوب." };

  const assignedMemberId = nullable(field(form, "assignedMemberId"));
  if (!assignedMemberId) {
    return { ok: false, message: "يرجى تعيين هذه المهمة لأحد أعضاء الفريق." };
  }

  const { data: member, error: memberErr } = await supabaseServer()
    .from("team_members")
    .select("id, name, device_id")
    .eq("id", assignedMemberId)
    .eq("device_id", session.deviceId)
    .maybeSingle();

  if (memberErr) return { ok: false, message: memberErr.message };
  if (!member) return { ok: false, message: "يرجى اختيار عضو فريق معتمد في هذا المكتب." };
  const assignedTo = member.name;

  const status = field(form, "status") || "pending_review";
  let completedAt: string | null = null;
  if (status === "completed") {
    if (id) {
      const { data: existing } = await supabaseServer()
        .from("tasks")
        .select("status, completed_at")
        .eq("id", id)
        .eq("device_id", session.deviceId)
        .maybeSingle();
      completedAt =
        existing?.status === "completed" && existing?.completed_at
          ? existing.completed_at
          : new Date().toISOString();
    } else {
      completedAt = new Date().toISOString();
    }
  }

  const row = {
    title,
    description: nullable(field(form, "description")),
    status,
    priority: field(form, "priority") || "medium",
    deadline_date: nullable(field(form, "deadlineDate")),
    deadline_time: nullable(field(form, "deadlineTime")),
    assigned_member_id: assignedMemberId,
    assigned_to: assignedTo,
    client_name: nullable(field(form, "clientName")),
    case_title: nullable(field(form, "caseTitle")),
    device_id: session.deviceId,
    source: "admin_app",
    completed_at: completedAt,
    updated_at: new Date().toISOString(),
  };

  const db = supabaseServer();
  const result = id
    ? await db.from("tasks").update(row).eq("id", id).eq("device_id", session.deviceId)
    : await db.from("tasks").insert(row);

  if (result.error) return { ok: false, message: result.error.message };
  await purgeExpiredCompletedTasks(session.deviceId);
  revalidatePath("/");
  return { ok: true, message: id ? "تم تحديث المهمة بنجاح." : "تم حفظ المهمة بنجاح." };
}

export async function deleteTask(form: FormData): Promise<ActionState> {
  const session = await requireSession();
  const id = field(form, "id");
  if (!id) return { ok: false, message: "المهمة غير محددة." };
  const { error } = await supabaseServer()
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("device_id", session.deviceId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true, message: "تم حذف المهمة." };
}

export async function updateTaskStatus(id: string, newStatus: string): Promise<ActionState> {
  const session = await requireSession();
  if (!id || !newStatus) return { ok: false, message: "طلب غير صالح." };

  const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

  const { error } = await supabaseServer()
    .from("tasks")
    .update({
      status: newStatus,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("device_id", session.deviceId);

  if (error) return { ok: false, message: error.message };
  await purgeExpiredCompletedTasks(session.deviceId);
  revalidatePath("/");
  return { ok: true, message: "تم تحديث حالة المهمة." };
}

export async function addMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const session = await requireSession();
  const name = field(form, "name");
  const username = field(form, "username");
  const roleName = field(form, "roleName") || "عضو فريق";
  if (!name || !username) {
    return { ok: false, message: "الاسم واسم المستخدم مطلوبان." };
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
  return { ok: true, message: "تمت إضافة عضو الفريق بنجاح." };
}
