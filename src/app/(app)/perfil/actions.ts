"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const fullName = text(formData, "full_name");
  if (!fullName) return { error: "Informe seu nome." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: text(formData, "phone"),
      pillar_id: text(formData, "pillar_id"),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = text(formData, "password");
  if (!password || password.length < 6) {
    return { error: "A nova senha precisa ter pelo menos 6 caracteres." };
  }
  if (password !== text(formData, "password_confirm")) {
    return { error: "As senhas não conferem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { ok: true };
}

/** Só admin: muda o papel e a área de alguém do time. */
export async function updateTeamMember(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: "Só administradores podem alterar a equipe." };

  const id = text(formData, "id");
  if (!id) return { error: "Pessoa não encontrada." };

  const role = text(formData, "role") === "admin" ? "admin" : "member";
  if (id === user.id && role !== "admin") {
    return { error: "Você não pode remover o seu próprio acesso de administrador." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role, pillar_id: text(formData, "pillar_id") })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/equipe");
  return { ok: true };
}
