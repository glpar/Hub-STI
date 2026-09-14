import { PageHeader } from "@/components/ui/page-header";
import type { Engagement } from "@/lib/database.types";
import { getCompanies } from "@/lib/queries";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { CompanyList } from "./company-list";

export const metadata = { title: "Empresas" };

export default async function CompaniesPage() {
  const { pillars, cycle } = await getSessionContext();
  const supabase = await createClient();

  const [companies, { data: engagements }] = await Promise.all([
    getCompanies(),
    supabase.from("engagements").select("*"),
  ]);

  return (
    <>
      <PageHeader
        title="Empresas"
        subtitle="Todas as empresas atendidas pelo time, em qualquer ciclo"
      />

      <CompanyList
        companies={companies}
        engagements={(engagements ?? []) as Engagement[]}
        pillars={pillars}
        cycleId={cycle?.id ?? null}
        cycleName={cycle?.name ?? null}
      />
    </>
  );
}
