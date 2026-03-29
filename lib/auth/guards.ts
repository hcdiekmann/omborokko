import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/http";
import type { Tables } from "@/types/database";

export type AuthContext = {
  user: User;
  profile: Tables<"profiles">;
};

export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("Authentication required", 401, "unauthorized");
  }

  return { supabase, user };
}

export async function requireAdmin(): Promise<AuthContext & { supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> }> {
  const { supabase, user } = await requireAuthenticatedUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load profile", 500, "profile_lookup_failed", error);
  }

  const typedProfile = (profile ?? null) as Tables<"profiles"> | null;

  if (!typedProfile || typedProfile.role !== "admin") {
    throw new AppError("Admin access required", 403, "forbidden");
  }

  return { supabase, user, profile: typedProfile };
}
