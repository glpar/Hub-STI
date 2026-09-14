import { PageHeader } from "@/components/ui/page-header";
import { getTeam } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

import { TeamList } from "./team-list";

export const metadata = { title: "Equipe" };

export default async function TeamPage() {
  const { profile, pillars } = await requireAdmin();
  const team = await getTeam();

  return (
    <>
      <PageHeader
        title="Equipe"
        subtitle="Quem tem acesso ao Hub e qual é a área de cada pessoa"
      />
      <TeamList team={team} pillars={pillars} currentUserId={profile.id} />
    </>
  );
}
