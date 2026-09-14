import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Cycle, Pillar, Profile } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export const CYCLE_COOKIE = "hub-sti-ciclo";

export type SessionContext = {
  profile: Profile;
  pillars: Pillar[];
  cycles: Cycle[];
  /** Ciclo escolhido no seletor do topo (ou o marcado como atual). */
  cycle: Cycle | null;
};

/**
 * Carrega tudo que praticamente toda tela precisa: perfil, pilares, ciclos e o
 * ciclo selecionado. Redireciona para o login se não houver sessão.
 */
export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const [{ data: profile }, { data: pillars }, { data: cycles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("pillars").select("*").order("sort_order"),
    supabase.from("cycles").select("*").order("start_date", { ascending: false }),
  ]);

  if (!profile) redirect("/entrar");

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(CYCLE_COOKIE)?.value;
  const cycleList = cycles ?? [];

  const cycle =
    cycleList.find((item) => item.id === selectedId) ??
    cycleList.find((item) => item.is_current) ??
    cycleList[0] ??
    null;

  return {
    profile: profile as Profile,
    pillars: (pillars ?? []) as Pillar[],
    cycles: cycleList as Cycle[],
    cycle,
  };
}

export async function requireAdmin() {
  const context = await getSessionContext();
  if (context.profile.role !== "admin") redirect("/");
  return context;
}
