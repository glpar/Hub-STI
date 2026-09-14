"use client";

import { useMemo, useState, useTransition } from "react";

import { CalendarRange, CheckCircle2, Pencil, Plus, Target, Trash2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { pillarTheme } from "@/lib/constants";
import type { AnnualGoal, Cycle, CycleGoal, Engagement, Pillar } from "@/lib/database.types";
import { formatCurrency, formatDateRange } from "@/lib/format";
import { buildPillarProgress } from "@/lib/stats";
import { useSheetAction } from "@/lib/use-sheet-action";

import {
  deleteCycle,
  saveAnnualGoals,
  saveCycle,
  saveCycleGoals,
  setCurrentCycle,
  type ActionState,
} from "./actions";

type Props = {
  pillars: Pillar[];
  cycles: Cycle[];
  cycleGoals: CycleGoal[];
  annualGoals: AnnualGoal[];
  engagements: Engagement[];
  years: number[];
  selectedYear: number;
  isAdmin: boolean;
};

export function GoalsManager({
  pillars,
  cycles,
  cycleGoals,
  annualGoals,
  engagements,
  years,
  selectedYear,
  isAdmin,
}: Props) {
  const [year, setYear] = useState(selectedYear);
  const [cycleForm, setCycleForm] = useState<{ open: boolean; cycle?: Cycle }>({ open: false });
  const [goalsFor, setGoalsFor] = useState<Cycle | null>(null);
  const [annualOpen, setAnnualOpen] = useState(false);

  const yearCycles = cycles.filter((cycle) => cycle.year === year);
  const yearCycleIds = new Set(yearCycles.map((cycle) => cycle.id));
  const yearEngagements = engagements.filter((item) => yearCycleIds.has(item.cycle_id));

  const yearProgress = useMemo(
    () =>
      buildPillarProgress(
        pillars,
        yearEngagements,
        annualGoals.filter((goal) => goal.year === year),
      ),
    [pillars, yearEngagements, annualGoals, year],
  );

  const allYears = useMemo(
    () => [...new Set([...years, year, new Date().getFullYear()])].sort((a, b) => b - a),
    [years, year],
  );

  return (
    <div className="space-y-5">
      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
        {allYears.slice(0, 5).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setYear(option)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              option === year ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {option}
          </button>
        ))}
      </nav>

      {/* Meta anual */}
      <section className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Target className="h-4 w-4 text-primary" />
              Meta anual de {year}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Quantas empresas cada área precisa fechar no ano inteiro.
            </p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              className="btn-ghost shrink-0 px-3 py-2"
              onClick={() => setAnnualOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <ul className="mt-3 divide-y divide-line">
          {yearProgress.map((progress) => (
            <li key={progress.pillar.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${pillarTheme(progress.pillar.id).solid}`}
                  />
                  {progress.pillar.name}
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {progress.closed}
                  <span className="font-semibold text-muted">/{progress.target || "—"}</span>
                </span>
              </div>
              <div className="mt-2">
                <Progress
                  value={progress.closed}
                  max={progress.target}
                  barClassName={pillarTheme(progress.pillar.id).solid}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                {progress.targetRevenue > 0
                  ? `${formatCurrency(progress.revenue)} de ${formatCurrency(progress.targetRevenue)}`
                  : progress.revenue > 0
                    ? formatCurrency(progress.revenue)
                    : "sem valor registrado"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Ciclos */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="section-title">Ciclos de {year}</h2>
          {isAdmin ? (
            <button
              type="button"
              className="btn-primary px-3 py-2 text-xs"
              onClick={() => setCycleForm({ open: true })}
            >
              <Plus className="h-4 w-4" />
              Novo ciclo
            </button>
          ) : null}
        </div>

        {yearCycles.length === 0 ? (
          <div className="card px-6 py-10 text-center">
            <CalendarRange className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 font-semibold">Nenhum ciclo em {year}</p>
            <p className="mt-1 text-sm text-muted">
              {isAdmin
                ? "Crie o primeiro ciclo do ano para começar a lançar empresas."
                : "Peça para um administrador cadastrar os ciclos."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {yearCycles.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                pillars={pillars}
                goals={cycleGoals.filter((goal) => goal.cycle_id === cycle.id)}
                engagements={engagements.filter((item) => item.cycle_id === cycle.id)}
                isAdmin={isAdmin}
                onEdit={() => setCycleForm({ open: true, cycle })}
                onEditGoals={() => setGoalsFor(cycle)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Formulário de ciclo */}
      {cycleForm.open ? (
        <CycleSheet
          cycle={cycleForm.cycle}
          year={year}
          onClose={() => setCycleForm({ open: false })}
        />
      ) : null}

      {/* Metas do ciclo */}
      {goalsFor ? (
        <GoalsSheet
          title={`Metas do ${goalsFor.name}`}
          pillars={pillars}
          values={cycleGoals.filter((goal) => goal.cycle_id === goalsFor.id)}
          hiddenField={{ name: "cycle_id", value: goalsFor.id }}
          action={saveCycleGoals}
          onClose={() => setGoalsFor(null)}
        />
      ) : null}

      {/* Metas anuais */}
      {annualOpen ? (
        <GoalsSheet
          title={`Meta anual de ${year}`}
          pillars={pillars}
          values={annualGoals.filter((goal) => goal.year === year)}
          hiddenField={{ name: "year", value: String(year) }}
          action={saveAnnualGoals}
          onClose={() => setAnnualOpen(false)}
        />
      ) : null}
    </div>
  );
}

function CycleCard({
  cycle,
  pillars,
  goals,
  engagements,
  isAdmin,
  onEdit,
  onEditGoals,
}: {
  cycle: Cycle;
  pillars: Pillar[];
  goals: CycleGoal[];
  engagements: Engagement[];
  isAdmin: boolean;
  onEdit: () => void;
  onEditGoals: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const progress = buildPillarProgress(pillars, engagements, goals);
  const closed = progress.reduce((sum, item) => sum + item.closed, 0);
  const target = progress.reduce((sum, item) => sum + item.target, 0);

  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {cycle.name}
            {cycle.is_current ? (
              <span className="pill bg-primary-soft text-primary">ciclo atual</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {formatDateRange(cycle.start_date, cycle.end_date)}
          </p>
        </div>

        {isAdmin ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2"
              aria-label="Editar ciclo"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-rose-600"
              aria-label="Excluir ciclo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm">
          <span className="text-2xl font-bold tabular-nums">{closed}</span>
          <span className="text-lg font-semibold text-muted">/{target || "—"}</span>
          <span className="ml-2 text-xs text-muted">empresas fechadas</span>
        </p>
        {isAdmin ? (
          <button type="button" className="btn-ghost px-3 py-2 text-xs" onClick={onEditGoals}>
            <Target className="h-4 w-4" />
            Definir metas
          </button>
        ) : null}
      </div>

      <ul className="mt-3 space-y-2 border-t border-line pt-3">
        {progress.map((item) => (
          <li key={item.pillar.id}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${pillarTheme(item.pillar.id).solid}`} />
                {item.pillar.short_name}
              </span>
              <span className="font-semibold tabular-nums">
                {item.closed}/{item.target || "—"}
                {item.target > 0 && item.remaining > 0 ? (
                  <span className="ml-1 font-normal text-muted">
                    (faltam {item.remaining})
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-1">
              <Progress
                value={item.closed}
                max={item.target}
                barClassName={pillarTheme(item.pillar.id).solid}
              />
            </div>
          </li>
        ))}
      </ul>

      {isAdmin && !cycle.is_current ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await setCurrentCycle(cycle.id)))}
          className="btn-ghost mt-3 w-full text-xs"
        >
          <CheckCircle2 className="h-4 w-4" />
          Marcar como ciclo atual
        </button>
      ) : null}

      {confirming ? (
        <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2.5 dark:bg-rose-950/40">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Excluir o ciclo apaga também as empresas lançadas nele. Tem certeza?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="text-sm font-semibold text-muted"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              className="text-sm font-semibold text-rose-700 dark:text-rose-300"
              onClick={() => startTransition(async () => void (await deleteCycle(cycle.id)))}
            >
              Excluir ciclo
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function CycleSheet({
  cycle,
  year,
  onClose,
}: {
  cycle?: Cycle;
  year: number;
  onClose: () => void;
}) {
  const { submit, error } = useSheetAction(saveCycle, onClose);

  return (
    <Sheet
      open
      onClose={onClose}
      title={cycle ? "Editar ciclo" : "Novo ciclo"}
      description="Um ciclo agrupa as empresas atendidas em um período"
    >
      <form action={submit} className="space-y-4">
        {cycle ? <input type="hidden" name="id" value={cycle.id} /> : null}

        <div>
          <label className="label" htmlFor="name">
            Nome do ciclo
          </label>
          <input
            id="name"
            name="name"
            className="input"
            required
            placeholder={`Ciclo ${year}.1`}
            defaultValue={cycle?.name ?? ""}
          />
        </div>

        <div>
          <label className="label" htmlFor="year">
            Ano
          </label>
          <input
            id="year"
            name="year"
            type="number"
            inputMode="numeric"
            className="input"
            defaultValue={cycle?.year ?? year}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="start_date">
              Início
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              className="input"
              required
              defaultValue={cycle?.start_date ?? `${year}-01-01`}
            />
          </div>
          <div>
            <label className="label" htmlFor="end_date">
              Fim
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              className="input"
              required
              defaultValue={cycle?.end_date ?? `${year}-06-30`}
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancelar
          </button>
          <SubmitButton className="btn-primary flex-1">Salvar</SubmitButton>
        </div>
      </form>
    </Sheet>
  );
}

function GoalsSheet({
  title,
  pillars,
  values,
  hiddenField,
  action,
  onClose,
}: {
  title: string;
  pillars: Pillar[];
  values: { pillar_id: string; target_companies: number; target_revenue: number }[];
  hiddenField: { name: string; value: string };
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onClose: () => void;
}) {
  const { submit, error } = useSheetAction(action, onClose);

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      description="Quantas empresas cada área precisa fechar"
    >
      <form action={submit} className="space-y-4">
        <input type="hidden" name={hiddenField.name} value={hiddenField.value} />

        {pillars.map((pillar) => {
          const goal = values.find((item) => item.pillar_id === pillar.id);
          return (
            <fieldset key={pillar.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${pillarTheme(pillar.id).solid}`} />
                {pillar.name}
              </legend>
              <input type="hidden" name="pillar_ids" value={pillar.id} />

              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor={`empresas_${pillar.id}`}>
                    Empresas
                  </label>
                  <input
                    id={`empresas_${pillar.id}`}
                    name={`empresas_${pillar.id}`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="input"
                    defaultValue={goal?.target_companies ?? 0}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`valor_${pillar.id}`}>
                    Valor (R$)
                  </label>
                  <input
                    id={`valor_${pillar.id}`}
                    name={`valor_${pillar.id}`}
                    inputMode="decimal"
                    className="input"
                    placeholder="opcional"
                    defaultValue={
                      goal?.target_revenue ? String(goal.target_revenue).replace(".", ",") : ""
                    }
                  />
                </div>
              </div>
            </fieldset>
          );
        })}

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancelar
          </button>
          <SubmitButton className="btn-primary flex-1">Salvar metas</SubmitButton>
        </div>
      </form>
    </Sheet>
  );
}
