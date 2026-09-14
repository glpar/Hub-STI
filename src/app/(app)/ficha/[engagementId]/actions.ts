"use server";

import { revalidatePath } from "next/cache";

import type { EnergyMonth } from "@/lib/energy";
import { parseFaturaWorkbook, type FaturaImport } from "@/lib/fatura-import";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

/** Toda action confere a sessão; o RLS do banco é a segunda barreira. */
async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type VisitPayload = {
  visitId: string;
  engagementId: string;
  companyId: string;
  visitDate: string | null;
  visitNumber: string | null;
  consultantName: string | null;
  enabledSections: string[];
  answers: Record<string, Record<string, unknown>>;
  energyMonths: EnergyMonth[];
  hasGd: boolean;
  gdPowerKwp: number | null;
  status: "rascunho" | "concluida";
};

export async function saveVisit(payload: VisitPayload): Promise<ActionState> {
  const { supabase, user } = await authed();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase
    .from("technical_visits")
    .update({
      visit_date: payload.visitDate,
      visit_number: payload.visitNumber,
      consultant_name: payload.consultantName,
      enabled_sections: payload.enabledSections,
      answers: payload.answers,
      energy_months: payload.energyMonths,
      has_gd: payload.hasGd,
      gd_power_kwp: payload.gdPowerKwp,
      status: payload.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.visitId);

  if (error) return { error: error.message };

  revalidatePath(`/ficha/${payload.engagementId}`);
  revalidatePath(`/ficha/${payload.engagementId}/relatorio`);
  revalidatePath(`/empresas/${payload.companyId}`);
  return { ok: true };
}

/** Lê a planilha de fatura e devolve os meses já preenchidos (não grava nada). */
export async function importFatura(
  formData: FormData,
): Promise<{ error?: string; data?: FaturaImport }> {
  const { user } = await authed();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const file = formData.get("planilha");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione a planilha de fatura (.xlsx)." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { error: "A planilha passa de 4 MB." };
  }

  try {
    const data = await parseFaturaWorkbook(await file.arrayBuffer());
    if (data.months.length === 0) {
      return { error: data.warnings[0] ?? "Não consegui ler os meses da planilha." };
    }
    return { data };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "arquivo inválido";
    return { error: `Não consegui ler a planilha: ${message}` };
  }
}

export async function addVisitPhoto(input: {
  visitId: string;
  engagementId: string;
  sectionId: string;
  storagePath: string;
  caption: string | null;
  position: number;
}): Promise<ActionState> {
  const { supabase, user } = await authed();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.from("technical_visit_photos").insert({
    visit_id: input.visitId,
    section_id: input.sectionId,
    storage_path: input.storagePath,
    caption: input.caption,
    position: input.position,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/ficha/${input.engagementId}`);
  revalidatePath(`/ficha/${input.engagementId}/relatorio`);
  return { ok: true };
}

export async function updatePhotoCaption(
  id: string,
  engagementId: string,
  caption: string,
): Promise<ActionState> {
  const { supabase, user } = await authed();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase
    .from("technical_visit_photos")
    .update({ caption: caption.trim() || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/ficha/${engagementId}`);
  revalidatePath(`/ficha/${engagementId}/relatorio`);
  return { ok: true };
}

export async function deleteVisitPhoto(
  id: string,
  storagePath: string,
  engagementId: string,
): Promise<ActionState> {
  const { supabase, user } = await authed();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  await supabase.storage.from("ficha-fotos").remove([storagePath]);
  const { error } = await supabase.from("technical_visit_photos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/ficha/${engagementId}`);
  revalidatePath(`/ficha/${engagementId}/relatorio`);
  return { ok: true };
}

/** Links temporários para exibir as fotos (bucket privado). */
export async function signPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const { supabase, user } = await authed();
  if (!user || paths.length === 0) return {};

  const { data } = await supabase.storage.from("ficha-fotos").createSignedUrls(paths, 60 * 60);

  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}
