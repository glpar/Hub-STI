import { PageHeader } from "@/components/ui/page-header";
import { getCompanies, getCycleEngagements, getCycleGoals, getTeam } from "@/lib/queries";
import { getSessionContext } from "@/lib/session";

import { Board, BoardEmptyCycle, type BoardView } from "./board";

export const metadata = { title: "Quadro" };

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ pilar?: string; visao?: string; pessoa?: string }>;
}) {
  const { pilar, visao, pessoa } = await searchParams;
  const { profile, pillars, cycle } = await getSessionContext();

  if (!cycle) {
    return (
      <>
        <PageHeader title="Quadro" />
        <BoardEmptyCycle />
      </>
    );
  }

  const [engagements, companies, team, goals] = await Promise.all([
    getCycleEngagements(cycle.id),
    getCompanies(),
    getTeam(),
    getCycleGoals(cycle.id),
  ]);

  return (
    <>
      <PageHeader
        title="Quadro"
        subtitle={`${cycle.name} · ${engagements.length} empresa${engagements.length === 1 ? "" : "s"} no quadro`}
      />

      <Board
        cycle={cycle}
        engagements={engagements}
        companies={companies}
        pillars={pillars}
        team={team}
        goals={goals}
        currentUserId={profile.id}
        initialPillar={pilar && pillars.some((item) => item.id === pilar) ? pilar : "todas"}
        initialView={(visao === "geral" ? "geral" : "pessoa") satisfies BoardView}
        initialPerson={
          pessoa === "eu"
            ? profile.id
            : pessoa && team.some((person) => person.id === pessoa)
              ? pessoa
              : "todos"
        }
      />
    </>
  );
}
