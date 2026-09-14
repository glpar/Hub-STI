"use server";

import { revalidatePath } from "next/cache";

import type { Engagement, EngagementStatus } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function number(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return 0;
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function createEngagement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const cycleId = text(formData, "cycle_id");
  const pillarId = text(formData, "pillar_id");
  if (!cycleId) return { error: "Escolha um ciclo." };
  if (!pillarId) return { error: "Escolha a área (pilar)." };

  let companyId = text(formData, "company_id");

  // Empresa nova digitada na hora
  if (!companyId) {
    const name = text(formData, "company_name");
    if (!name) return { error: "Informe a empresa." };

    const { data: created, error: companyError } = await supabase
      .from("companies")
      .insert({
        name,
        city: text(formData, "company_city"),
        state: text(formData, "company_state"),
        created_by: user.id,
      })
      .select("id")
      .single();

    if (companyError) return { error: `Não foi possível criar a empresa: ${companyError.message}` };
    companyId = created.id;
  }

  const { error } = await supabase.from("engagements").insert({
    company_id: companyId,
    pillar_id: pillarId,
    cycle_id: cycleId,
    status: (text(formData, "status") ?? "prospeccao") as EngagementStatus,
    owner_id: text(formData, "owner_id") ?? user.id,
    sourced_by_id: text(formData, "sourced_by_id"),
    sourced_pillar_id: text(formData, "sourced_pillar_id"),
    value: number(formData, "value"),
    contract_date: text(formData, "contract_date"),
    notes: text(formData, "notes"),
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Essa empresa já tem um registro dessa área neste ciclo. Abra o card existente em vez de criar outro.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/quadro");
  revalidatePath("/");
  revalidatePath("/empresas");
  return { ok: true };
}

export async function updateEngagement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const id = text(formData, "id");
  if (!id) return { error: "Registro não encontrado." };

  const { error } = await supabase
    .from("engagements")
    .update({
      status: (text(formData, "status") ?? "prospeccao") as EngagementStatus,
      owner_id: text(formData, "owner_id"),
      sourced_by_id: text(formData, "sourced_by_id"),
      sourced_pillar_id: text(formData, "sourced_pillar_id"),
      value: number(formData, "value"),
      contract_date: text(formData, "contract_date"),
      start_date: text(formData, "start_date"),
      end_date: text(formData, "end_date"),
      counts_toward_goal: formData.get("counts_toward_goal") === "on",
      notes: text(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/quadro");
  revalidatePath("/");
  revalidatePath("/empresas");
  return { ok: true };
}

/** Usado pelo arrastar-e-soltar do quadro. */
export async function moveEngagement(id: string, status: EngagementStatus) {
  const supabase = await createClient();

  const patch: Partial<Engagement> = { status, updated_at: new Date().toISOString() };
  if (status === "contratada") {
    const { data } = await supabase.from("engagements").select("contract_date").eq("id", id).single();
    if (data && !data.contract_date) patch.contract_date = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("engagements").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quadro");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteEngagement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("engagements").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quadro");
  revalidatePath("/");
  revalidatePath("/empresas");
  return { ok: true };
}
