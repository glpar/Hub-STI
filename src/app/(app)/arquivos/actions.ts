"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/**
 * O arquivo em si vai direto do navegador para o Storage do Supabase.
 * Aqui só registramos os metadados e com quem ele é compartilhado.
 */
export async function registerDocument(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const name = text(formData, "name");
  const storagePath = text(formData, "storage_path");
  if (!name || !storagePath) return { error: "Selecione um arquivo." };

  const visibility = text(formData, "visibility") === "specific" ? "specific" : "all";
  const recipients = formData.getAll("recipients").filter((value): value is string =>
    typeof value === "string" && value !== "",
  );

  if (visibility === "specific" && recipients.length === 0) {
    return { error: "Escolha pelo menos uma pessoa para receber o arquivo." };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      name,
      storage_path: storagePath,
      mime_type: text(formData, "mime_type"),
      size_bytes: Number(formData.get("size_bytes") ?? 0),
      description: text(formData, "description"),
      visibility,
      cycle_id: text(formData, "cycle_id"),
      company_id: text(formData, "company_id"),
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (visibility === "specific") {
    const { error: recipientsError } = await supabase
      .from("document_recipients")
      .insert(recipients.map((userId) => ({ document_id: data.id, user_id: userId })));
    if (recipientsError) return { error: recipientsError.message };
  }

  revalidatePath("/arquivos");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteDocument(id: string, storagePath: string) {
  const supabase = await createClient();

  await supabase.storage.from("documentos").remove([storagePath]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/arquivos");
  revalidatePath("/");
  return { ok: true };
}

/** Gera um link temporário de download (válido por 1 minuto). */
export async function getDownloadUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(storagePath, 60);

  if (error || !data) return { error: error?.message ?? "Não foi possível gerar o link." };
  return { url: data.signedUrl };
}
