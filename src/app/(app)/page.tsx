import Link from "next/link";

import {
  CalendarRange,
  FileText,
  FolderOpen,
  Plane,
  Target,
  TrendingUp,
} from "lucide-react";

import { GoalCard, GoalRow } from "@/components/dashboard/goal-card";
import { StatusPill } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { STATUS_ORDER } from "@/lib/constants";
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  daysUntil,
  firstName,
} from "@/lib/format";
import {
  getAnnualGoals,
  getCycleEngagements,
  getCycleGoals,
  getKnownYears,
  getRecentDocuments,
  getUpcomingTrips,
  getYearEngagements,
} from "@/lib/queries";
import { getSessionContext } from "@/lib/session";
import { buildPillarProgress, buildTotals } from "@/lib/stats";

export const metadata = { title: "Início" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano } = await searchParams;
  const { profile, pillars, cycle, cycles } = await getSessionContext();

  const years = await getKnownYears();
  const selectedYear = Number(ano) || cycle?.year || years[0] || new Date().getFullYear();

  const [cycleEngagements, cycleGoals, yearEngagements, annualGoals, trips, documents] =
    await Promise.all([
      getCycleEngagements(cycle?.id ?? null),
      getCycleGoals(cycle?.id ?? null),
      getYearEngagements(selectedYear),
      getAnnualGoals(selectedYear),
      getUpcomingTrips(3),
      getRecentDocuments(4),
    ]);

  const cycleProgress = buildPillarProgress(pillars, cycleEngagements, cycleGoals);
  const cycleTotals = buildTotals(cycleProgress, cycleEngagements);

  const yearProgress = buildPillarProgress(pillars, yearEngagements, annualGoals);
  const yearTotals = buildTotals(yearProgress, yearEngagements);

  const daysLeft = cycle ? daysUntil(cycle.end_date) : null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">Olá, {firstName(profile.full_name || "time")} 👋</p>
        <h1 className="text-2xl font-bold tracking-tight">Como estamos indo</h1>
      </div>

      {cycles.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Nenhum ciclo cadastrado ainda"
          description="Os números começam a aparecer assim que o primeiro ciclo e suas metas forem criados."
          action={
            <Link href="/metas" className="btn-primary">
              Criar primeiro ciclo
            </Link>
          }
        />
      ) : null}

      {/* ------------------------------------------------ Ciclo selecionado */}
      {cycle ? (
        <section className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <p className="section-title">Ciclo selecionado</p>
                <p className="mt-0.5 text-base font-bold">{cycle.name}</p>
              </div>
              <div className="text-right text-xs text-muted">
                <p>{formatDateRange(cycle.start_date, cycle.end_date)}</p>
                {daysLeft !== null ? (
                  <p className="mt-0.5 font-semibold text-fg">
                    {daysLeft > 0
                      ? `faltam ${daysLeft} dia${daysLeft === 1 ? "" : "s"}`
                      : daysLeft === 0
                        ? "último dia"
                        : "ciclo encerrado"}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted">Total fechado no ciclo</p>
                  <p className="mt-1 text-4xl font-bold leading-none tabular-nums">
                    {cycleTotals.closed}
                    <span className="text-2xl font-semibold text-muted">
                      /{cycleTotals.target || "—"}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted">Faltam para a meta</p>
                  <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-primary">
                    {cycleTotals.remaining}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Progress value={cycleTotals.closed} max={cycleTotals.target} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Empresas distintas" value={cycleTotals.uniqueCompanies} />
                <Stat label="Em aberto" value={cycleTotals.pipeline} />
                <Stat label="Atingido" value={`${cycleTotals.percent}%`} />
                <Stat label="Valor fechado" value={formatCurrency(cycleTotals.revenue)} />
              </div>

              <p className="mt-4 rounded-xl bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
                O contador considera cada <strong className="text-fg">contrato por área</strong>:
                uma mesma empresa pode entrar em Eficiência Energética e em Lean no mesmo ciclo e
                conta uma vez para cada meta — nunca duas vezes na mesma.
              </p>
            </div>
          </div>

          <div>
            <h2 className="section-title mb-2">Meta por área neste ciclo</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cycleProgress.map((progress) => (
                <GoalCard
                  key={progress.pillar.id}
                  progress={progress}
                  href={`/quadro?pilar=${progress.pillar.id}`}
                />
              ))}
            </div>
          </div>

          {/* Resumo do quadro */}
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-title">Situação no quadro</h2>
              <Link href="/quadro" className="text-xs font-semibold text-primary">
                abrir quadro
              </Link>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {STATUS_ORDER.map((status) => {
                const count = cycleEngagements.filter((item) => item.status === status).length;
                return (
                  <li key={status} className="flex items-center gap-1.5">
                    <StatusPill status={status} />
                    <span className="text-sm font-bold tabular-nums">{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------- Ano a ano */}
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Resultado do ano</h2>
          <nav className="flex gap-1 rounded-xl bg-surface-2 p-1">
            {years.slice(0, 4).map((year) => (
              <Link
                key={year}
                href={`/?ano=${year}`}
                scroll={false}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  year === selectedYear
                    ? "bg-surface text-fg shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                {year}
              </Link>
            ))}
          </nav>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted">Meta anual {selectedYear}</p>
              <p className="mt-1 text-3xl font-bold leading-none tabular-nums">
                {yearTotals.closed}
                <span className="text-xl font-semibold text-muted">
                  /{yearTotals.target || "—"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted" />
              <span className="font-semibold">{yearTotals.percent}%</span>
              <span className="text-muted">· faltam {yearTotals.remaining}</span>
            </div>
          </div>

          <div className="mt-4 divide-y divide-line">
            {yearProgress.map((progress) => (
              <GoalRow key={progress.pillar.id} progress={progress} />
            ))}
          </div>

          <p className="mt-3 text-xs text-muted">
            {yearTotals.uniqueCompanies} empresa
            {yearTotals.uniqueCompanies === 1 ? "" : "s"} distinta
            {yearTotals.uniqueCompanies === 1 ? "" : "s"} em {selectedYear} ·{" "}
            {formatCurrency(yearTotals.revenue)} fechados
          </p>
        </div>
      </section>

      {/* ------------------------------------------- Viagens e arquivos */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-title">Próximas viagens</h2>
            <Link href="/viagens" className="text-xs font-semibold text-primary">
              ver todas
            </Link>
          </div>

          {trips.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Plane className="h-4 w-4" />
              Nenhuma viagem programada.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {trips.map((trip) => (
                <li key={trip.id} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                    <Plane className="h-4 w-4 text-muted" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{trip.title}</p>
                    <p className="truncate text-xs text-muted">
                      {trip.destination} · {formatDateRange(trip.start_date, trip.end_date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-title">Arquivos recentes</h2>
            <Link href="/arquivos" className="text-xs font-semibold text-primary">
              ver todos
            </Link>
          </div>

          {documents.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <FolderOpen className="h-4 w-4" />
              Nenhum arquivo compartilhado ainda.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {documents.map((document) => (
                <li key={document.id} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                    <FileText className="h-4 w-4 text-muted" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{document.name}</p>
                    <p className="truncate text-xs text-muted">
                      {document.visibility === "all" ? "Para todos" : "Compartilhado"} ·{" "}
                      {formatDate(document.created_at.slice(0, 10))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {profile.role === "admin" ? (
        <Link
          href="/metas"
          className="card flex items-center gap-3 p-4 transition hover:border-line-strong"
        >
          <Target className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Ajustar metas e ciclos</p>
            <p className="text-xs text-muted">
              Defina a meta anual e a meta de cada ciclo por área.
            </p>
          </div>
        </Link>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-0.5 truncate text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}
