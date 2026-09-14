import { PageHeader } from "@/components/ui/page-header";
import type { DocumentRecipient, DocumentRow } from "@/lib/database.types";
import { getCompanies, getTeam } from "@/lib/queries";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { FilesView } from "./files-view";

export const metadata = { title: "Arquivos" };

export default async function FilesPage() {
  const { profile, cycles, cycle } = await getSessionContext();
  const supabase = await createClient();

  const [{ data: documents }, { data: recipients }, companies, team] = await Promise.all([
    supabase.from("documents").select("*").order("created_at", { ascending: false }),
    supabase.from("document_recipients").select("*"),
    getCompanies(),
    getTeam(),
  ]);

  return (
    <>
      <PageHeader
        title="Arquivos"
        subtitle="Compartilhe com todo o time ou só com quem precisa ver"
      />

      <FilesView
        documents={(documents ?? []) as DocumentRow[]}
        recipients={(recipients ?? []) as DocumentRecipient[]}
        companies={companies}
        cycles={cycles}
        team={team}
        currentUser={profile}
        defaultCycleId={cycle?.id ?? null}
      />
    </>
  );
}
