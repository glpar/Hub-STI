"use client";

import { useMemo, useState, useTransition } from "react";

import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import type { Company, Cycle, Profile, Trip, TripParticipant } from "@/lib/database.types";
import { formatDateRange, initials, todayISO } from "@/lib/format";

import { deleteTrip } from "./actions";
import { TripSheet } from "./trip-sheet";

type Props = {
  trips: Trip[];
  participants: TripParticipant[];
  companies: Company[];
  cycles: Cycle[];
  team: Profile[];
  currentUser: Profile;
  defaultCycleId: string | null;
};

export function TripsView({
  trips,
  participants,
  companies,
  cycles,
  team,
  currentUser,
  defaultCycleId,
}: Props) {
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [showPast, setShowPast] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = todayISO();

  const participantsByTrip = useMemo(() => {
    const map = new Map<string, Profile[]>();
    for (const row of participants) {
      const person = team.find((item) => item.id === row.user_id);
      if (!person) continue;
      const list = map.get(row.trip_id) ?? [];
      list.push(person);
      map.set(row.trip_id, list);
    }
    return map;
  }, [participants, team]);

  const upcoming = trips.filter((trip) => trip.end_date >= today);
  const past = trips.filter((trip) => trip.end_date < today).reverse();
  const listed = showPast ? past : upcoming;

  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [month]);

  const tripsOnDay = (iso: string) =>
    trips.filter((trip) => trip.start_date <= iso && iso <= trip.end_date);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex flex-1 gap-1 rounded-xl bg-surface-2 p-1">
          <ViewButton
            active={view === "lista"}
            onClick={() => setView("lista")}
            icon={<List className="h-4 w-4" />}
            label="Lista"
          />
          <ViewButton
            active={view === "calendario"}
            onClick={() => setView("calendario")}
            icon={<CalendarDays className="h-4 w-4" />}
            label="Calendário"
          />
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova viagem</span>
        </button>
      </div>

      {view === "calendario" ? (
        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-sm font-bold capitalize">
              {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <button
              type="button"
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const dayTrips = tripsOnDay(iso);
              const outside = !isSameMonth(day, month);
              const selected = selectedDay === iso;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDay(selected ? null : iso)}
                  className={`flex aspect-square flex-col items-center justify-start rounded-lg py-1 text-xs transition ${
                    selected
                      ? "bg-primary text-primary-fg"
                      : outside
                        ? "text-muted/40"
                        : "hover:bg-surface-2"
                  } ${isToday(day) && !selected ? "font-bold text-primary" : ""}`}
                >
                  <span>{format(day, "d")}</span>
                  {dayTrips.length > 0 ? (
                    <span className="mt-0.5 flex gap-0.5">
                      {dayTrips.slice(0, 3).map((trip) => (
                        <span
                          key={trip.id}
                          className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-primary-fg" : "bg-primary"}`}
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {selectedDay ? (
            <div className="mt-4 border-t border-line pt-3">
              <p className="section-title">
                {format(new Date(`${selectedDay}T12:00:00`), "EEEE, d 'de' MMMM", {
                  locale: ptBR,
                })}
              </p>
              {tripsOnDay(selectedDay).length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nenhuma viagem neste dia.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {tripsOnDay(selectedDay).map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      people={participantsByTrip.get(trip.id) ?? []}
                      companies={companies}
                      currentUser={currentUser}
                      onEdit={() => setEditingTrip(trip)}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
            <ViewButton
              active={!showPast}
              onClick={() => setShowPast(false)}
              label={`Próximas (${upcoming.length})`}
            />
            <ViewButton
              active={showPast}
              onClick={() => setShowPast(true)}
              label={`Já foram (${past.length})`}
            />
          </div>

          {listed.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={showPast ? "Nenhuma viagem passada" : "Nenhuma viagem programada"}
              description={
                showPast ? undefined : "Cadastre a próxima viagem para o time se organizar."
              }
              action={
                showPast ? undefined : (
                  <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
                    <Plus className="h-4 w-4" />
                    Nova viagem
                  </button>
                )
              }
            />
          ) : (
            <ul className="space-y-2">
              {listed.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  people={participantsByTrip.get(trip.id) ?? []}
                  companies={companies}
                  currentUser={currentUser}
                  onEdit={() => setEditingTrip(trip)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <TripSheet
        open={creating}
        onClose={() => setCreating(false)}
        companies={companies}
        cycles={cycles}
        team={team}
        defaultCycleId={defaultCycleId}
      />

      {editingTrip ? (
        <TripSheet
          open
          onClose={() => setEditingTrip(null)}
          trip={editingTrip}
          participantIds={(participantsByTrip.get(editingTrip.id) ?? []).map((item) => item.id)}
          companies={companies}
          cycles={cycles}
          team={team}
          defaultCycleId={defaultCycleId}
        />
      ) : null}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TripCard({
  trip,
  people,
  companies,
  currentUser,
  onEdit,
}: {
  trip: Trip;
  people: Profile[];
  companies: Company[];
  currentUser: Profile;
  onEdit: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const canEdit = trip.created_by === currentUser.id || currentUser.role === "admin";
  const company = companies.find((item) => item.id === trip.company_id);

  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{trip.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateRange(trip.start_date, trip.end_date)}
            </span>
          </p>
          {company ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Building2 className="h-3.5 w-3.5" />
              {company.name}
            </p>
          ) : null}
        </div>

        {canEdit ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2"
              aria-label="Editar viagem"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-rose-600"
              aria-label="Excluir viagem"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {trip.description ? (
        <p className="mt-2 whitespace-pre-line text-sm text-muted">{trip.description}</p>
      ) : null}

      {people.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <Users className="h-4 w-4 shrink-0 text-muted" />
          <div className="flex flex-wrap gap-1">
            {people.map((person) => (
              <span
                key={person.id}
                className="pill bg-surface-2 text-muted"
                title={person.full_name}
              >
                {initials(person.full_name || person.email)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {confirming ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-950/40">
          <p className="flex-1 text-sm text-rose-700 dark:text-rose-300">Excluir esta viagem?</p>
          <button
            type="button"
            className="text-sm font-semibold text-muted"
            onClick={() => setConfirming(false)}
          >
            Não
          </button>
          <button
            type="button"
            disabled={pending}
            className="text-sm font-semibold text-rose-700 dark:text-rose-300"
            onClick={() => startTransition(async () => void (await deleteTrip(trip.id)))}
          >
            Excluir
          </button>
        </div>
      ) : null}
    </li>
  );
}
