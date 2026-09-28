"use client";

import { useState } from "react";



import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Company, Cycle, Profile, Trip } from "@/lib/database.types";
import { todayISO } from "@/lib/format";
import { useSheetAction } from "@/lib/use-sheet-action";

import { Switch } from "@/components/ui/switch";

import { saveTrip } from "./actions";

export function TripSheet({
  open,
  onClose,
  trip,
  participantIds = [],
  companies,
  cycles,
  team,
  defaultCycleId,
}: {
  open: boolean;
  onClose: () => void;
  trip?: Trip;
  participantIds?: string[];
  companies: Company[];
  cycles: Cycle[];
  team: Profile[];
  defaultCycleId: string | null;
}) {
  const { submit, error } = useSheetAction(saveTrip, onClose);
  const [voltaOutroDia, setVoltaOutroDia] = useState(
    Boolean(trip && trip.end_date !== trip.start_date),
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={trip ? "Editar viagem" : "Nova viagem"}
      description="Todo mundo do time enxerga as viagens cadastradas"
    >
      <form action={submit} className="space-y-4" key={trip?.id ?? "nova"}>
        {trip ? <input type="hidden" name="id" value={trip.id} /> : null}

        <div>
          <label className="label" htmlFor="title">
            Motivo da viagem
          </label>
          <input
            id="title"
            name="title"
            className="input"
            required
            placeholder="Visita técnica, diagnóstico, treinamento…"
            defaultValue={trip?.title ?? ""}
          />
        </div>

        <div>
          <label className="label" htmlFor="destination">
            Destino
          </label>
          <input
            id="destination"
            name="destination"
            className="input"
            required
            placeholder="Cidade / UF"
            defaultValue={trip?.destination ?? ""}
          />
        </div>

        <div>
          <label className="label" htmlFor="start_date">
            Data
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="input"
            required
            defaultValue={trip?.start_date ?? todayISO()}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="start_time">
              Saída
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              className="input"
              defaultValue={trip?.start_time?.slice(0, 5) ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="end_time">
              Retorno
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              className="input"
              defaultValue={trip?.end_time?.slice(0, 5) ?? ""}
            />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface-2 p-3">
          <Switch
            checked={voltaOutroDia}
            onChange={setVoltaOutroDia}
            label="Volta em outro dia"
            description="Deixe desligado para ida e volta no mesmo dia, como é de costume."
          />
          <input
            type="hidden"
            name="volta_outro_dia"
            value={voltaOutroDia ? "on" : ""}
          />

          {voltaOutroDia ? (
            <div className="mt-3">
              <label className="label" htmlFor="end_date">
                Data da volta
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                className="input"
                defaultValue={trip?.end_date ?? ""}
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="company_id">
              Empresa (opcional)
            </label>
            <select
              id="company_id"
              name="company_id"
              className="input"
              defaultValue={trip?.company_id ?? ""}
            >
              <option value="">—</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cycle_id">
              Ciclo
            </label>
            <select
              id="cycle_id"
              name="cycle_id"
              className="input"
              defaultValue={trip?.cycle_id ?? defaultCycleId ?? ""}
            >
              <option value="">—</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="label">Quem vai</legend>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line bg-surface-2 p-2">
            {team.map((person) => (
              <label
                key={person.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-surface"
              >
                <input
                  type="checkbox"
                  name="participants"
                  value={person.id}
                  defaultChecked={participantIds.includes(person.id)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm">{person.full_name || person.email}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="description">
            Observações
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="input"
            placeholder="Hospedagem, horários, quem dirige…"
            defaultValue={trip?.description ?? ""}
          />
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
          <SubmitButton className="btn-primary flex-1">
            {trip ? "Salvar" : "Cadastrar viagem"}
          </SubmitButton>
        </div>
      </form>
    </Sheet>
  );
}
