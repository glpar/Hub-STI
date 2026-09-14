import { PageHeader } from "@/components/ui/page-header";
import type { AnnualGoal, CycleGoal, Engagement } from "@/lib/database.types";
import { getKnownYears } from "@/lib/queries";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { GoalsManager } from "./goals-manager";

export const metadata = { title: "Metas e ciclos" };

export default async function GoalsPage() {
  const { profile, pillars, cycles, cycle } = await getSessionContext();
  const supabase = await createClient();

  const [{ data: cycleGoals }, { data: annualGoals }, { data: engagements }, years] =
    await Promise.all([
      supabase.from("cycle_goals").select("*"),
      supabase.from("annual_goals").select("*"),
      supabase.from("engagements").select("*"),
      getKnownYears(),
    ]);

  return (
    <>
      <PageHeader
        title="Metas e ciclos"
        subtitle={
          profile.role === "admin"
            ? "Defina os ciclos do ano e a meta de cada área"
            : "Acompanhe as metas definidas pela coordenação"
        }
      />

      <GoalsManager
        pillars={pillars}
        cycles={cycles}
        cycleGoals={(cycleGoals ?? []) as CycleGoal[]}
        annualGoals={(annualGoals ?? []) as AnnualGoal[]}
        engagements={(engagements ?? []) as Engagement[]}
        years={years}
        selectedYear={cycle?.year ?? years[0] ?? new Date().getFullYear()}
        isAdmin={profile.role === "admin"}
      />
    </>
  );
}
