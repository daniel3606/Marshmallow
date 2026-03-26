import { supabase } from "./supabase";

// ============================================
// MARSHMALLOW
// ============================================

export async function fetchMarshmallow(userId: string) {
  const { data, error } = await supabase
    .from("marshmallows")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMarshmallow(
  userId: string,
  updates: {
    name?: string;
    color?: string;
    size_cm?: number;
    total_blocked_minutes?: number;
    name_changes_used?: number;
    color_changes_used?: number;
  }
) {
  const { data, error } = await supabase
    .from("marshmallows")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// BLOCKING SESSIONS
// ============================================

export async function createBlockingSession(
  userId: string,
  durationMinutes: number,
  wasStrongBlock: boolean = false
) {
  const { data, error } = await supabase
    .from("blocking_sessions")
    .insert({
      user_id: userId,
      duration_minutes: durationMinutes,
      was_strong_block: wasStrongBlock,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeBlockingSession(
  sessionId: string,
  minutesBlocked: number,
  growthCm: number
) {
  const { data, error } = await supabase
    .from("blocking_sessions")
    .update({
      ended_at: new Date().toISOString(),
      completed: true,
      duration_minutes: minutesBlocked,
      growth_cm: growthCm,
    })
    .eq("id", sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBlockingSessions(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("blocking_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ============================================
// SCHEDULED BLOCKS
// ============================================

export async function fetchScheduledBlocks(userId: string) {
  const { data, error } = await supabase
    .from("scheduled_blocks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createScheduledBlock(
  userId: string,
  block: {
    name: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    is_strong_block?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("scheduled_blocks")
    .insert({ user_id: userId, ...block })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateScheduledBlock(
  blockId: string,
  updates: {
    name?: string;
    days_of_week?: number[];
    start_time?: string;
    end_time?: string;
    is_strong_block?: boolean;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("scheduled_blocks")
    .update(updates)
    .eq("id", blockId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteScheduledBlock(blockId: string) {
  const { error } = await supabase
    .from("scheduled_blocks")
    .delete()
    .eq("id", blockId);
  if (error) throw error;
}

// ============================================
// STREAKS
// ============================================

export async function fetchStreak(userId: string) {
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateStreak(userId: string) {
  const streak = await fetchStreak(userId);
  const today = new Date().toISOString().split("T")[0];

  // No streak row yet — create one
  if (!streak) {
    const { data, error } = await supabase
      .from("streaks")
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let newStreak = streak.current_streak;
  if (streak.last_active_date === today) {
    return streak; // Already counted today
  } else if (streak.last_active_date === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1; // Streak broken, restart
  }

  const { data, error } = await supabase
    .from("streaks")
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak),
      last_active_date: today,
    })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// ACHIEVEMENTS
// ============================================

export async function fetchAchievements(userId: string) {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function unlockAchievement(userId: string, achievementKey: string) {
  const { data, error } = await supabase
    .from("achievements")
    .upsert(
      { user_id: userId, achievement_key: achievementKey },
      { onConflict: "user_id,achievement_key" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// SUBSCRIPTION
// ============================================

export async function fetchSubscription(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  // No subscription row = free user, not an error
  if (error) throw error;
  return data;
}

export async function upsertSubscription(
  userId: string,
  subscription: {
    product_id: string;
    status: string;
    original_transaction_id?: string;
    latest_receipt?: string;
    purchase_date?: string;
    expires_at?: string;
    is_trial?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      { user_id: userId, ...subscription },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// USER SETTINGS
// ============================================

export async function fetchUserSettings(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserSettings(
  userId: string,
  updates: {
    notifications_enabled?: boolean;
    growth_rate_multiplier?: number;
  }
) {
  const { data, error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// FRIENDS
// ============================================

export interface FriendData {
  user_id: string;
  display_name: string | null;
  marshmallow_name: string | null;
  marshmallow_color: string | null;
  size_cm: number | null;
  total_blocked_minutes: number | null;
  current_streak: number;
  longest_streak: number;
  friends_since: string;
}

export async function getFriendsWithData(): Promise<FriendData[]> {
  const { data, error } = await supabase.rpc("get_friends_with_data");
  if (error) throw error;
  return (data as FriendData[]) ?? [];
}

export async function addFriendByCode(code: string) {
  const { data, error } = await supabase.rpc("add_friend_by_code", {
    code: code.toUpperCase().trim(),
  });
  if (error) throw error;
  return data as { success: boolean; error?: string; friend_id?: string };
}

export async function removeFriend(friendUserId: string) {
  const { data, error } = await supabase.rpc("remove_friend", {
    target_friend_id: friendUserId,
  });
  if (error) throw error;
  return data as { success: boolean; error?: string };
}

export async function getMyFriendCode(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("friend_code")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.friend_code as string;
}

// ============================================
// PREMIUM STATUS (via RPC)
// ============================================

export async function getPremiumStatus(userId: string) {
  const { data, error } = await supabase.rpc("get_premium_status", {
    check_user_id: userId,
  });
  if (error) throw error;
  return data as {
    is_premium: boolean;
    status: string;
    expires_at: string | null;
    features: {
      unlimited_scheduled_blocks: boolean;
      strong_block: boolean;
      growth_rate: number;
      streak_saver: boolean;
      rare_cosmetics: boolean;
      unlimited_customization: boolean;
    };
  };
}
