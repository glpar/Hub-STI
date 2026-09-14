import type {
  AnnualGoal,
  Company,
  CycleGoal,
  DocumentRow,
  Engagement,
  Profile,
  Trip,
} from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export async function getCycleEngagements(cycleId: string | null): Promise<Engagement[]> {
  if (!cycleId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("engagements")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("position");
  return (data ?? []) as Engagement[];
}

export async function getYearEngagements(year: number): Promise<Engagement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("engagements")
    .select("*, cycles!inner(year)")
    .eq("cycles.year", year);
  return (data ?? []) as unknown as Engagement[];
}

export async function getCycleGoals(cycleId: string | null): Promise<CycleGoal[]> {
  if (!cycleId) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("cycle_goals").select("*").eq("cycle_id", cycleId);
  return (data ?? []) as CycleGoal[];
}

export async function getAnnualGoals(year: number): Promise<AnnualGoal[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("annual_goals").select("*").eq("year", year);
  return (data ?? []) as AnnualGoal[];
}

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").order("name");
  return (data ?? []) as Company[];
}

export async function getTeam(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  return (data ?? []) as Profile[];
}

export async function getUpcomingTrips(limit = 4): Promise<Trip[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("trips")
    .select("*")
    .gte("end_date", today)
    .order("start_date")
    .limit(limit);
  return (data ?? []) as Trip[];
}

export async function getRecentDocuments(limit = 5): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DocumentRow[];
}

/** Anos que já têm ciclo ou meta cadastrada, do mais novo para o mais antigo. */
export async function getKnownYears(): Promise<number[]> {
  const supabase = await createClient();
  const [{ data: cycles }, { data: goals }] = await Promise.all([
    supabase.from("cycles").select("year"),
    supabase.from("annual_goals").select("year"),
  ]);

  const years = new Set<number>([
    new Date().getFullYear(),
    ...(cycles ?? []).map((row) => row.year),
    ...(goals ?? []).map((row) => row.year),
  ]);

  return [...years].sort((a, b) => b - a);
}
