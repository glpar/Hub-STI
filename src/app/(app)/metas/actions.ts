"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function int(formData: FormData, key: string) {
  const parsed = Number(text(formData, key) ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

function money(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return 0;
  const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { supabase, error: "Só quem é administrador pode alterar metas e ciclos." };
  }
  return { supabase, error: null };
}

export async function saveCycle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, error: authError } = await ensureAdmin();
  if (authError) return { error: authError };

  const name = text(formData, "name");
  const startDate = text(formData, "start_date");
  const endDate = text(formData, "end_date");

  if (!name) return { error: "Dê um nome ao ciclo (ex.: Ciclo 2026.1)." };
  if (!startDate || !endDate) return { error: "Informe o início e o fim do ciclo." };
  if (endDate < startDate) return { error: "O fim não pode ser antes do início." };

  const year = int(formData, "year") || Number(startDate.slice(0, 4));
  const payload = { name, year, start_date: startDate, end_date: endDate };
  const id = text(formData, "id");

  const { error } = id
    ? await supabase.from("cycles").update(payload).eq("id", id)
    : await supabase.from("cycles").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/metas");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setCurrentCycle(id: string) {
  const { supabase, error: authError } = await ensureAdmin();
  if (authError) return { error: authError };

  await supabase.from("cycles").update({ is_current: false }).eq("is_current", true);
  const { error } = await supabase.from("cycles").update({ is_current: true }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/metas");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCycle(id: string) {
  const { supabase, error: authError } = await ensureAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("cycles").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/metas");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Salva a meta de cada pilar dentro de um ciclo. */
export async function saveCycleGoals(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, error: authError } = await ensureAdmin();
  if (authError) return { error: authError };

  const cycleId = text(formData, "cycle_id");
  const pillarIds = formData.getAll("pillar_ids").filter((value): value is string =>
    typeof value === "string",
  );
  if (!cycleId) return { error: "Ciclo não encontrado." };

  const rows = pillarIds.map((pillarId) => ({
    cycle_id: cycleId,
    pillar_id: pillarId,
    target_companies: int(formData, `empresas_${pillarId}`),
    target_revenue: money(formData, `valor_${pillarId}`),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("cycle_goals")
    .upsert(rows, { onConflict: "cycle_id,pillar_id" });

  if (error) return { error: error.message };

  revalidatePath("/metas");
  revalidatePath("/");
  revalidatePath("/quadro");
  return { ok: true };
}

/** Salva a meta anual de cada pilar. */
export async function saveAnnualGoals(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, error: authError } = await ensureAdmin();
  if (authError) return { error: authError };

  const year = int(formData, "year");
  const pillarIds = formData.getAll("pillar_ids").filter((value): value is string =>
    typeof value === "string",
  );
  if (!year) return { error: "Ano inválido." };

  const rows = pillarIds.map((pillarId) => ({
    year,
    pillar_id: pillarId,
    target_companies: int(formData, `empresas_${pillarId}`),
    target_revenue: money(formData, `valor_${pillarId}`),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("annual_goals")
    .upsert(rows, { onConflict: "year,pillar_id" });

  if (error) return { error: error.message };

  revalidatePath("/metas");
  revalidatePath("/");
  return { ok: true };
}
