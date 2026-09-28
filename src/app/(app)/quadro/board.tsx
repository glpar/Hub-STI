"use client";

import Link from "next/link";
import { useId, useMemo, useOptimistic, useState, useTransition } from "react";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ArrowRight, LayoutGrid, Plus, Rows3, Search, User } from "lucide-react";

import { PillarDot } from "@/components/ui/badges";
import { Progress } from "@/components/ui/progress";
import { STATUS_META, STATUS_ORDER, isClosed, isPipeline, pillarTheme } from "@/lib/constants";
import type {
  Company,
  Cycle,
  CycleGoal,
  Engagement,
  EngagementStatus,
  Pillar,
  Profile,
} from "@/lib/database.types";
import { firstName, formatCurrency, initials } from "@/lib/format";
import { buildPillarProgress } from "@/lib/stats";

import { moveEngagement } from "./actions";
import { EngagementSheet } from "./engagement-sheet";
import { NewEngagementSheet } from "./new-engagement-sheet";

type Props = {
  cycle: Cycle;
  engagements: Engagement[];
  companies: Company[];
  pillars: Pillar[];
  team: Profile[];
  goals: CycleGoal[];
  currentUserId: string;
  initialPillar: string;
  initialView: BoardView;
  initialPerson: string;
};

/** "pessoa": uma faixa por pessoa. "geral": tudo junto, como um quadro só. */
export type BoardView = "pessoa" | "geral";

/** Chave de responsável: id da pessoa ou "sem" para cards sem responsável. */
const SEM = "sem";
const ownerKey = (engagement: Engagement) => engagement.owner_id ?? SEM;

export function Board({
  cycle,
  engagements,
  companies,
  pillars,
  team,
  goals,
  currentUserId,
  initialPillar,
  initialView,
  initialPerson,
}: Props) {
  const [pillarFilter, setPillarFilter] = useState(initialPillar);
  const [view, setView] = useState<BoardView>(initialView);
  const [personFilter, setPersonFilter] = useState(initialPerson);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Id estável: sem ele o dnd-kit numera por contador e o HTML do servidor
  // não bate com o do navegador (aviso de hidratação).
  const dndId = useId();

  const [items, moveOptimistic] = useOptimistic(
    engagements,
    (state: Engagement[], update: { id: string; status: EngagementStatus }) =>
      state.map((item) =>
        item.id === update.id ? { ...item, status: update.status } : item,
      ),
  );

  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const personById = useMemo(() => new Map(team.map((person) => [person.id, person])), [team]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (pillarFilter !== "todas" && item.pillar_id !== pillarFilter) return false;
      if (personFilter !== "todos" && ownerKey(item) !== personFilter) return false;
      if (!term) return true;
      const company = companyById.get(item.company_id);
      return (
        company?.name.toLowerCase().includes(term) ||
        company?.city?.toLowerCase().includes(term) ||
        item.notes?.toLowerCase().includes(term)
      );
    });
  }, [items, pillarFilter, personFilter, search, companyById]);

  // Faixas da visão por pessoa: você primeiro, depois o time em ordem
  // alfabética, e "sem responsável" no fim se houver algum card assim.
  const lanes = useMemo(() => {
    const me = team.find((person) => person.id === currentUserId);
    const others = team
      .filter((person) => person.id !== currentUserId)
      .sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email, "pt-BR"));

    const list: { key: string; person: Profile | null }[] = [
      ...(me ? [{ key: me.id, person: me }] : []),
      ...others.map((person) => ({ key: person.id, person })),
    ];
    if (items.some((item) => !item.owner_id)) list.push({ key: SEM, person: null });

    return personFilter === "todos" ? list : list.filter((lane) => lane.key === personFilter);
  }, [team, currentUserId, items, personFilter]);

  // Quantos cards cada pessoa tem (respeitando área e busca, não o filtro de pessoa).
  const countByOwner = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = new Map<string, number>();
    for (const item of items) {
      if (pillarFilter !== "todas" && item.pillar_id !== pillarFilter) continue;
      if (term) {
        const company = companyById.get(item.company_id);
        const match =
          company?.name.toLowerCase().includes(term) ||
          company?.city?.toLowerCase().includes(term) ||
          item.notes?.toLowerCase().includes(term);
        if (!match) continue;
      }
      map.set(ownerKey(item), (map.get(ownerKey(item)) ?? 0) + 1);
    }
    return map;
  }, [items, pillarFilter, search, companyById]);

  const progress = useMemo(
    () => buildPillarProgress(pillars, items, goals),
    [pillars, items, goals],
  );

  const shownProgress =
    pillarFilter === "todas"
      ? progress
      : progress.filter((item) => item.pillar.id === pillarFilter);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    // Visão geral: id do alvo é a situação. Por pessoa: "responsável::situação".
    const [laneKey, rawStatus] = String(over.id).includes("::")
      ? String(over.id).split("::")
      : [null, String(over.id)];
    const status = rawStatus as EngagementStatus;
    if (!STATUS_ORDER.includes(status)) return;

    const engagement = items.find((item) => item.id === active.id);
    if (!engagement || engagement.status === status) return;

    // Cada um cuida das suas: soltar na faixa de outra pessoa não faz nada.
    // Trocar o responsável é pelo campo "Responsável", dentro do card.
    if (laneKey !== null && laneKey !== ownerKey(engagement)) return;

    startTransition(async () => {
      moveOptimistic({ id: engagement.id, status });
      await moveEngagement(engagement.id, status);
    });
  }

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const dragging = items.find((item) => item.id === draggingId) ?? null;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Buscar empresa…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova empresa no quadro</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-surface-2 p-1" role="tablist" aria-label="Como ver o quadro">
            <ViewButton
              active={view === "pessoa"}
              onClick={() => setView("pessoa")}
              icon={<Rows3 className="h-4 w-4" />}
              label="Por pessoa"
            />
            <ViewButton
              active={view === "geral"}
              onClick={() => setView("geral")}
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Visão geral"
            />
          </div>
        </div>

        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <FilterChip
            active={personFilter === "todos"}
            onClick={() => setPersonFilter("todos")}
            label="Todo mundo"
            count={[...countByOwner.values()].reduce((total, n) => total + n, 0)}
          />
          <FilterChip
            active={personFilter === currentUserId}
            onClick={() => setPersonFilter(currentUserId)}
            label="Meu quadro"
            count={countByOwner.get(currentUserId) ?? 0}
          />
          {team
            .filter((person) => person.id !== currentUserId)
            .sort((a, b) =>
              (a.full_name || a.email).localeCompare(b.full_name || b.email, "pt-BR"),
            )
            .map((person) => (
              <FilterChip
                key={person.id}
                active={personFilter === person.id}
                onClick={() => setPersonFilter(person.id)}
                label={firstName(person.full_name || person.email)}
                count={countByOwner.get(person.id) ?? 0}
              />
            ))}
          {countByOwner.get(SEM) ? (
            <FilterChip
              active={personFilter === SEM}
              onClick={() => setPersonFilter(SEM)}
              label="Sem responsável"
              count={countByOwner.get(SEM) ?? 0}
            />
          ) : null}
        </div>

        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <FilterChip
            active={pillarFilter === "todas"}
            onClick={() => setPillarFilter("todas")}
            label="Todas as áreas"
          />
          {pillars.map((pillar) => (
            <FilterChip
              key={pillar.id}
              active={pillarFilter === pillar.id}
              onClick={() => setPillarFilter(pillar.id)}
              label={pillar.short_name}
              pillarId={pillar.id}
            />
          ))}
        </div>
      </div>

      {/* Contadores X/Y */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shownProgress.map((item) => {
          const theme = pillarTheme(item.pillar.id);
          return (
            <div key={item.pillar.id} className="card px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <PillarDot pillarId={item.pillar.id} />
                  {item.pillar.short_name}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {item.closed}
                  <span className="text-sm font-semibold text-muted">/{item.target || "—"}</span>
                </span>
              </div>
              <div className="mt-2">
                <Progress value={item.closed} max={item.target} barClassName={theme.solid} />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {item.target > 0
                  ? item.remaining === 0
                    ? "Meta batida 🎉"
                    : `Faltam ${item.remaining} para fechar a meta`
                  : "Meta ainda não definida"}
                {item.pipeline > 0 ? ` · ${item.pipeline} em aberto` : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quadro */}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggingId(null)}
      >
        {view === "geral" ? (
          <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:snap-none sm:px-0">
            {STATUS_ORDER.map((status) => (
              <Column
                key={status}
                dropId={status}
                status={status}
                cards={visible.filter((item) => item.status === status)}
                companyById={companyById}
                personById={personById}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {lanes.map((lane) => (
              <PersonLane
                key={lane.key}
                laneKey={lane.key}
                person={lane.person}
                isMe={lane.key === currentUserId}
                cards={visible.filter((item) => ownerKey(item) === lane.key)}
                companyById={companyById}
                personById={personById}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {dragging ? (
            <Card
              engagement={dragging}
              company={companyById.get(dragging.company_id)}
              owner={dragging.owner_id ? personById.get(dragging.owner_id) : undefined}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className="text-xs text-muted">
        Arraste um card para mudar a situação. No celular, segure o card por um instante antes de
        arrastar — ou toque nele e use o campo <strong className="text-fg">Situação</strong>.
        {view === "pessoa"
          ? " Cada um movimenta as suas empresas; para passar uma empresa para outra pessoa, abra o card e troque o Responsável."
          : null}
      </p>

      <NewEngagementSheet
        open={creating}
        onClose={() => setCreating(false)}
        cycle={cycle}
        companies={companies}
        pillars={pillars}
        team={team}
        currentUserId={currentUserId}
        defaultPillar={pillarFilter === "todas" ? "" : pillarFilter}
      />

      <EngagementSheet
        key={selected?.id ?? "nenhum"}
        engagement={selected}
        company={selected ? companyById.get(selected.company_id) : undefined}
        pillars={pillars}
        team={team}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  pillarId,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  pillarId?: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-line bg-surface text-muted hover:text-fg"
      }`}
    >
      {pillarId ? <PillarDot pillarId={pillarId} /> : null}
      {label}
      {count !== undefined ? (
        <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}

function Column({
  dropId,
  status,
  cards,
  companyById,
  personById,
  onSelect,
  compact = false,
}: {
  dropId: string;
  compact?: boolean;
  status: EngagementStatus;
  cards: Engagement[];
  companyById: Map<string, Company>;
  personById: Map<string, Profile>;
  onSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const meta = STATUS_META[status];

  return (
    <section
      ref={setNodeRef}
      className={`flex shrink-0 snap-start flex-col rounded-2xl border bg-surface-2 transition ${
        compact ? "w-[70vw] sm:w-60" : "w-[82vw] sm:w-72"
      } ${
        isOver ? "border-primary ring-2 ring-primary/30" : "border-line"
      }`}
    >
      <header className="rounded-t-2xl px-3 pt-3">
        <span className={`block h-1 w-10 rounded-full ${meta.bar}`} />
        <div className="mt-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">{meta.label}</h2>
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold tabular-nums">
            {cards.length}
          </span>
        </div>
        {compact ? null : (
          <p className="mt-0.5 text-[11px] leading-snug text-muted">{meta.description}</p>
        )}
      </header>

      <div className={`flex flex-1 flex-col gap-2 p-3 ${compact ? "min-h-16" : "min-h-24"}`}>
        {cards.length === 0 ? (
          <p
            className={`rounded-xl border border-dashed border-line px-3 text-center text-xs text-muted ${
              compact ? "py-3" : "py-6"
            }`}
          >
            Nada aqui
          </p>
        ) : (
          cards.map((engagement) => (
            <DraggableCard
              key={engagement.id}
              engagement={engagement}
              company={companyById.get(engagement.company_id)}
              owner={engagement.owner_id ? personById.get(engagement.owner_id) : undefined}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PersonLane({
  laneKey,
  person,
  isMe,
  cards,
  companyById,
  personById,
  onSelect,
}: {
  laneKey: string;
  person: Profile | null;
  isMe: boolean;
  cards: Engagement[];
  companyById: Map<string, Company>;
  personById: Map<string, Profile>;
  onSelect: (id: string) => void;
}) {
  const name = person ? person.full_name || person.email : "Sem responsável";
  const abertas = cards.filter((item) => isPipeline(item.status)).length;
  const fechadas = cards.filter((item) => isClosed(item.status)).length;

  return (
    <section className="card overflow-hidden" aria-label={`Quadro de ${name}`}>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            person ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"
          }`}
        >
          {person ? initials(name) : <User className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {name}
            {isMe ? <span className="ml-1.5 text-xs font-normal text-muted">(você)</span> : null}
          </p>
          <p className="text-xs text-muted">
            {cards.length === 0
              ? "Nenhuma empresa no quadro"
              : `${cards.length} empresa${cards.length === 1 ? "" : "s"} · ${abertas} em aberto · ${fechadas} fechada${fechadas === 1 ? "" : "s"}`}
          </p>
        </div>
      </header>

      {cards.length > 0 ? (
        <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto p-3 sm:snap-none">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              compact
              dropId={`${laneKey}::${status}`}
              status={status}
              cards={cards.filter((item) => item.status === status)}
              companyById={companyById}
              personById={personById}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DraggableCard({
  engagement,
  company,
  owner,
  onSelect,
}: {
  engagement: Engagement;
  company: Company | undefined;
  owner: Profile | undefined;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: engagement.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(engagement.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(engagement.id);
        }
      }}
      className={`cursor-grab touch-manipulation rounded-xl border border-line bg-surface p-3 text-left shadow-sm transition active:cursor-grabbing ${
        isDragging ? "opacity-30" : "hover:border-line-strong"
      }`}
    >
      <Card engagement={engagement} company={company} owner={owner} />
    </div>
  );
}

function Card({
  engagement,
  company,
  owner,
  overlay = false,
}: {
  engagement: Engagement;
  company: Company | undefined;
  owner: Profile | undefined;
  overlay?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start gap-2">
        <PillarDot pillarId={engagement.pillar_id} />
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
          {company?.name ?? "Empresa removida"}
        </p>
      </div>

      {company?.city ? (
        <p className="mt-0.5 pl-4 text-xs text-muted">
          {company.city}
          {company.state ? ` · ${company.state}` : ""}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-4">
        {engagement.value > 0 ? (
          <span className="text-xs font-semibold tabular-nums">
            {formatCurrency(engagement.value)}
          </span>
        ) : null}
        {!engagement.counts_toward_goal ? (
          <span className="pill bg-surface-2 text-muted">não conta na meta</span>
        ) : null}
        {engagement.sourced_pillar_id && engagement.sourced_pillar_id !== engagement.pillar_id ? (
          <span className="pill bg-surface-2 text-muted">
            veio de outra área <ArrowRight className="h-3 w-3" />
          </span>
        ) : null}
        {owner ? (
          <span
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold"
            title={owner.full_name}
          >
            {initials(owner.full_name || owner.email)}
          </span>
        ) : (
          <User className="ml-auto h-4 w-4 text-muted" />
        )}
      </div>
    </>
  );

  if (!overlay) return body;

  return (
    <div className="w-64 rotate-2 rounded-xl border border-primary bg-surface p-3 shadow-2xl">
      {body}
    </div>
  );
}

export function BoardEmptyCycle() {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-semibold">Nenhum ciclo selecionado</p>
      <p className="mt-1 text-sm text-muted">
        Crie um ciclo em Metas para começar a montar o quadro.
      </p>
      <Link href="/metas" className="btn-primary mt-4">
        Ir para Metas
      </Link>
    </div>
  );
}
