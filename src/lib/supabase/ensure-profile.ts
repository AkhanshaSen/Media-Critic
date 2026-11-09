import type { SupabaseClient } from "@supabase/supabase-js";

/** Creates public.users + user_settings for the current session if missing. */
export async function ensureUserProfile(
  supabase: SupabaseClient,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("ensure_user_profile");
  if (error) {
    console.error("ensure_user_profile failed:", error.message);
    return {
      ok: false,
      error: "Could not set up your profile. Try signing in again.",
    };
  }
  return { ok: true };
}
