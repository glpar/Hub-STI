"use server";

import { revalidatePath } from "next/cache";

import { pillarFieldList } from "@/lib/pillar-fields";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean; id?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

const COMPANY_FIELDS = [
  "name",
  "cnpj",
  "city",
  "state",
  "sector",
  "contact_name",
  "contact_email",
  "contact_phone",
  "notes",
] as const;

export async function createCompany(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const name = text(formData, "name");
  if (!name) return { error: "Informe o nome da empresa." };

  const payload = Object.fromEntries(
    COMPANY_FIELDS.map((field) => [field, text(formData, field)]),
  );

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...payload, name, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/empresas");
  return { ok: true, id: data.id };
}

export async function updateCompany(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const id = text(formData, "id");
  if (!id) return { error: "Empresa não encontrada." };

  const name = text(formData, "name");
  if (!name) return { error: "Informe o nome da empresa." };

  const payload = Object.fromEntries(
    COMPANY_FIELDS.map((field) => [field, text(formData, field)]),
  );

  const { error } = await supabase
    .from("companies")
    .update({ ...payload, name, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${id}`);
  return { ok: true, id };
}

export async function deleteCompany(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/empresas");
  return { ok: true };
}

/**
 * Salva os campos técnicos do pilar (consumo kWh, horas de consultoria, etc.)
 * dentro do registro daquela empresa naquele ciclo.
 */
export async function savePillarData(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const engagementId = text(formData, "engagement_id");
  const pillarId = text(formData, "pillar_id");
  const companyId = text(formData, "company_id");
  if (!engagementId || !pillarId) return { error: "Registro não encontrado." };

  const data: Record<string, string | number | boolean | null> = {};

  for (const field of pillarFieldList(pillarId)) {
    const raw = formData.get(`campo_${field.key}`);

    if (field.type === "boolean") {
      data[field.key] = raw === "on";
      continue;
    }

    if (typeof raw !== "string" || raw.trim() === "") {
      data[field.key] = null;
      continue;
    }

    if (field.type === "number" || field.type === "currency" || field.type === "percent") {
      const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
      data[field.key] = Number.isFinite(parsed) ? parsed : null;
      continue;
    }

    data[field.key] = raw.trim();
  }

  const { error } = await supabase
    .from("engagements")
    .update({ pillar_data: data, updated_at: new Date().toISOString() })
    .eq("id", engagementId);

  if (error) return { error: error.message };

  if (companyId) revalidatePath(`/empresas/${companyId}`);
  return { ok: true };
}
