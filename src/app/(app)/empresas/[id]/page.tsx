import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeft } from "lucide-react";

import type { Company, DocumentRow, Engagement, Trip } from "@/lib/database.types";
import { getTeam } from "@/lib/queries";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { CompanyDetail } from "./company-detail";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, pillars, cycles, cycle } = await getSessionContext();
  const supabase = await createClient();

  const [{ data: company }, { data: engagements }, { data: documents }, { data: trips }, team] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("engagements")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("documents").select("*").eq("company_id", id),
      supabase.from("trips").select("*").eq("company_id", id).order("start_date"),
      getTeam(),
    ]);

  if (!company) notFound();

  // Ordena os contratos pelo ciclo mais recente
  const cycleOrder = new Map(cycles.map((item, index) => [item.id, index]));
  const sorted = ((engagements ?? []) as Engagement[]).sort(
    (a, b) => (cycleOrder.get(a.cycle_id) ?? 99) - (cycleOrder.get(b.cycle_id) ?? 99),
  );

  return (
    <>
      <Link
        href="/empresas"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        Empresas
      </Link>

      <CompanyDetail
        company={company as Company}
        engagements={sorted}
        pillars={pillars}
        cycles={cycles}
        team={team}
        documents={(documents ?? []) as DocumentRow[]}
        trips={(trips ?? []) as Trip[]}
        selectedCycleId={cycle?.id ?? null}
        myPillarId={profile.pillar_id}
      />
    </>
  );
}
