"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { CYCLE_COOKIE } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function selectCycle(cycleId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CYCLE_COOKIE, cycleId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
