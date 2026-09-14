import { PageHeader } from "@/components/ui/page-header";
import type { Trip, TripParticipant } from "@/lib/database.types";
import { getCompanies, getTeam } from "@/lib/queries";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { TripsView } from "./trips-view";

export const metadata = { title: "Viagens" };

export default async function TripsPage() {
  const { profile, cycles, cycle } = await getSessionContext();
  const supabase = await createClient();

  const [{ data: trips }, { data: participants }, companies, team] = await Promise.all([
    supabase.from("trips").select("*").order("start_date"),
    supabase.from("trip_participants").select("*"),
    getCompanies(),
    getTeam(),
  ]);

  return (
    <>
      <PageHeader
        title="Viagens"
        subtitle="Agenda compartilhada — todo mundo vê quem vai para onde e quando"
      />

      <TripsView
        trips={(trips ?? []) as Trip[]}
        participants={(participants ?? []) as TripParticipant[]}
        companies={companies}
        cycles={cycles}
        team={team}
        currentUser={profile}
        defaultCycleId={cycle?.id ?? null}
      />
    </>
  );
}
