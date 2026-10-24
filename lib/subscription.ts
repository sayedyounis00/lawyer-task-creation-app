import { supabaseServer } from "./supabase";

export type SubscriptionStatus = {
  isActive: boolean;
  expiresAt: string | null;
  message?: string;
};

export async function checkDeviceSubscription(deviceId: string): Promise<SubscriptionStatus> {
  const cleanId = deviceId.trim();
  if (!cleanId) {
    return {
      isActive: false,
      expiresAt: null,
      message: "معرف الجهاز غير صالح.",
    };
  }

  const db = supabaseServer();

  // 1. Direct device_managers check if is_active column exists
  try {
    const { data: dm } = await db
      .from("device_managers")
      .select("*")
      .eq("device_id", cleanId)
      .maybeSingle();

    if (dm && "is_active" in dm && (dm as Record<string, unknown>).is_active === false) {
      return {
        isActive: false,
        expiresAt: null,
        message: "حساب الجهاز غير نشط حالياً. يرجى سداد الاشتراك لتسجيل الدخول.",
      };
    }
  } catch {
    // column does not exist or table query failed
  }

  // 2. Query check_device RPC (checks app_devices.is_active and expiration)
  try {
    const { data: rpcData, error } = await db.rpc("check_device", {
      p_device_id: cleanId,
    });

    if (error) {
      return {
        isActive: false,
        expiresAt: null,
        message: "تعذر التحقق من حالة اشتراك الجهاز.",
      };
    }

    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!row) {
      return {
        isActive: false,
        expiresAt: null,
        message: "الجهاز غير مسجل أو غير مفعل. يرجى سداد الاشتراك لتسجيل الدخول.",
      };
    }

    const now = row.server_time ? new Date(row.server_time).getTime() : Date.now();
    let isActive = Boolean(row.is_active);

    if (isActive && row.expires_at) {
      const exp = new Date(row.expires_at).getTime();
      if (!isNaN(exp) && exp < now) {
        isActive = false;
      }
    }

    return {
      isActive,
      expiresAt: row.expires_at ?? null,
      message: isActive
        ? undefined
        : "اشتراك هذا الجهاز غير سارٍ أو منتهي الصلاحية. يرجى سداد الاشتراك لتسجيل الدخول.",
    };
  } catch {
    return {
      isActive: false,
      expiresAt: null,
      message: "حدث خطأ أثناء فحص حالة الاشتراك.",
    };
  }
}
