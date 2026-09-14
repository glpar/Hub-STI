"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function saveTrip(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const title = text(formData, "title");
  const destination = text(formData, "destination");
  const startDate = text(formData, "start_date");

  if (!title) return { error: "Informe o motivo/título da viagem." };
  if (!destination) return { error: "Informe o destino." };
  if (!startDate) return { error: "Informe a data de ida." };

  const endDate = text(formData, "end_date") ?? startDate;
  if (endDate < startDate) return { error: "A volta não pode ser antes da ida." };

  const payload = {
    title,
    destination,
    start_date: startDate,
    end_date: endDate,
    description: text(formData, "description"),
    company_id: text(formData, "company_id"),
    cycle_id: text(formData, "cycle_id"),
  };

  const id = text(formData, "id");
  const participants = formData.getAll("participants").filter((value): value is string =>
    typeof value === "string" && value !== "",
  );

  let tripId = id;

  if (id) {
    const { error } = await supabase.from("trips").update(payload).eq("id", id);
    if (error) return { error: error.message };
    await supabase.from("trip_participants").delete().eq("trip_id", id);
  } else {
    const { data, error } = await supabase
      .from("trips")
      .insert({ ...payload, created_by: user.id })
      .select("id")
      .single();
    if (error) return { error: error.message };
    tripId = data.id;
  }

  if (tripId && participants.length > 0) {
    await supabase
      .from("trip_participants")
      .insert(participants.map((userId) => ({ trip_id: tripId, user_id: userId })));
  }

  revalidatePath("/viagens");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTrip(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/viagens");
  revalidatePath("/");
  return { ok: true };
}
