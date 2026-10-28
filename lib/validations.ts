import { z } from "zod";

export const taskStatusEnum = z.enum([
  "pending_review",
  "in_progress",
  "completed",
  "rejected",
]);

export const taskPriorityEnum = z.enum(["high", "medium", "low"]);

export const signInSchema = z.object({
  deviceId: z
    .string()
    .trim()
    .min(1, "يرجى إدخال مفتاح الجهاز.")
    .max(100, "مفتاح الجهاز طويل جداً."),
  password: z
    .string()
    .min(1, "يرجى إدخال كلمة مرور المدير.")
    .max(128, "كلمة المرور طويلة جداً."),
});

export const saveTaskSchema = z.object({
  id: z.string().trim().optional().nullable(),
  title: z
    .string()
    .trim()
    .min(1, "عنوان المهمة مطلوب.")
    .max(250, "عنوان المهمة طويل جداً."),
  description: z.string().trim().max(2000, "الوصف طويل جداً.").optional().nullable(),
  status: taskStatusEnum.default("pending_review"),
  priority: taskPriorityEnum.default("medium"),
  deadlineDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صالحة (YYYY-MM-DD)")
    .optional()
    .nullable()
    .or(z.literal("")),
  deadlineTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "صيغة الوقت غير صالحة (HH:MM)")
    .optional()
    .nullable()
    .or(z.literal("")),
  assignedMemberId: z
    .string()
    .trim()
    .min(1, "يرجى تعيين هذه المهمة لأحد أعضاء الفريق."),
  clientName: z.string().trim().max(150, "اسم الموكل طويل جداً.").optional().nullable(),
  caseTitle: z.string().trim().max(250, "عنوان القضية طويل جداً.").optional().nullable(),
});

export const deleteTaskSchema = z.object({
  id: z.string().trim().min(1, "المهمة غير محددة."),
});

export const updateTaskStatusSchema = z.object({
  id: z.string().trim().min(1, "المهمة غير محددة."),
  newStatus: taskStatusEnum,
});

export const addMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "اسم العضو مطلوب.")
    .max(100, "الاسم طويل جداً."),
  username: z
    .string()
    .trim()
    .min(1, "اسم المستخدم مطلوب.")
    .max(50, "اسم المستخدم طويل جداً.")
    .regex(/^[a-zA-Z0-9_\u0600-\u06FF\s-]+$/, "اسم المستخدم يحتوي على رموز غير صالحة."),
  roleName: z.string().trim().max(100).default("عضو فريق"),
  roleId: z.string().trim().max(100).optional().nullable(),
  department: z.string().trim().max(100).optional().nullable(),
  position: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z
    .string()
    .trim()
    .email("البريد الإلكتروني غير صالح.")
    .optional()
    .nullable()
    .or(z.literal("")),
});
