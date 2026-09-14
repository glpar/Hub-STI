"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ClipboardList, Pencil, PlusCircle, X } from "lucide-react";

import { StatusPill } from "@/components/ui/badges";
import { SubmitButton } from "@/components/ui/submit-button";
import { pillarTheme } from "@/lib/constants";
import type { Company, Cycle, Engagement, Pillar, Profile } from "@/lib/database.types";
import { formatCurrency, formatDate } from "@/lib/format";
import { pillarSections, type PillarField } from "@/lib/pillar-fields";
import { useSheetAction } from "@/lib/use-sheet-action";

import { savePillarData } from "../actions";

type Props = {
  company: Company;
  pillar: Pillar;
  engagements: Engagement[];
  cycles: Cycle[];
  team: Profile[];
  selectedCycleId: string | null;
};

export function PillarPanel({
  company,
  pillar,
  engagements,
  cycles,
  team,
  selectedCycleId,
}: Props) {
  const ofPillar = useMemo(
    () => engagements.filter((item) => item.pillar_id === pillar.id),
    [engagements, pillar.id],
  );

  const preferred =
    ofPillar.find((item) => item.cycle_id === selectedCycleId)?.id ?? ofPillar[0]?.id ?? "";

  // `null` significa "seguir o ciclo selecionado lá em cima"
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const { submit, error } = useSheetAction(savePillarData, () => setEditing(false));

  const engagementId =
    chosenId && ofPillar.some((item) => item.id === chosenId) ? chosenId : preferred;
  const engagement = ofPillar.find((item) => item.id === engagementId) ?? ofPillar[0];
  const theme = pillarTheme(pillar.id);
  const sections = pillarSections(pillar.id);

  if (!engagement) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <PlusCircle className="h-8 w-8 text-muted" />
        <div>
          <p className="font-semibold">
            Esta empresa ainda não tem {pillar.name} em nenhum ciclo
          </p>
          <p className="mt-1 text-sm text-muted">
            Adicione a empresa ao quadro nesta área para começar a registrar os dados técnicos.
          </p>
        </div>
        <Link href="/quadro" className="btn-ghost">
          Ir para o quadro
        </Link>
      </div>
    );
  }

  const cycle = cycles.find((item) => item.id === engagement.cycle_id);
  const owner = team.find((item) => item.id === engagement.owner_id);
  const data = engagement.pillar_data ?? {};

  const highlights = sections
    .flatMap((section) => section.fields)
    .filter((field) => field.highlight && hasValue(data[field.key]));

  return (
    <div className="space-y-4">
      {/* Cabeçalho da área */}
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className={`h-2.5 w-2.5 rounded-full ${theme.solid}`} />
              {pillar.name}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <StatusPill status={engagement.status} />
              {owner ? <span>Responsável: {owner.full_name || owner.email}</span> : null}
              {engagement.value > 0 ? <span>{formatCurrency(engagement.value)}</span> : null}
            </p>
          </div>

          {ofPillar.length > 1 ? (
            <select
              className="input w-auto max-w-[55%] py-2 text-sm"
              value={engagementId}
              onChange={(event) => {
                setChosenId(event.target.value);
                setEditing(false);
              }}
              aria-label="Ciclo"
            >
              {ofPillar.map((item) => {
                const itemCycle = cycles.find((c) => c.id === item.cycle_id);
                return (
                  <option key={item.id} value={item.id}>
                    {itemCycle?.name ?? "Ciclo"}
                  </option>
                );
              })}
            </select>
          ) : (
            <span className="pill bg-surface-2 text-muted">{cycle?.name ?? "Sem ciclo"}</span>
          )}
        </div>

        {highlights.length > 0 && !editing ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {highlights.map((field) => (
              <div key={field.key} className="rounded-xl bg-surface-2 px-3 py-2.5">
                <dt className="text-[11px] font-medium leading-tight text-muted">{field.label}</dt>
                <dd className="mt-0.5 truncate text-base font-bold tabular-nums">
                  {display(field, data[field.key])}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {/* Ficha de visita técnica — só Eficiência Energética */}
      {pillar.id === "eficiencia_energetica" ? (
        <Link
          href={`/ficha/${engagement.id}`}
          className="card flex items-center gap-3 p-4 transition hover:border-line-strong"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <ClipboardList className="h-5 w-5 text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Ficha de visita técnica</span>
            <span className="block text-xs text-muted">
              Seções 1 a 4 obrigatórias · histórico de consumo, gráficos e relatório
            </span>
          </span>
        </Link>
      ) : null}

      {/* Campos técnicos */}
      {editing ? (
        <form action={submit} className="space-y-4">
          <input type="hidden" name="engagement_id" value={engagement.id} />
          <input type="hidden" name="pillar_id" value={pillar.id} />
          <input type="hidden" name="company_id" value={company.id} />

          {sections.map((section) => (
            <fieldset key={section.title} className="card p-4">
              <legend className="section-title px-1">{section.title}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className={field.type === "longtext" ? "sm:col-span-2" : undefined}
                  >
                    <FieldInput field={field} value={data[field.key]} />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}

          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button type="button" className="btn-ghost flex-1" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <SubmitButton className="btn-primary flex-1">Salvar dados</SubmitButton>
          </div>
        </form>
      ) : (
        <>
          {sections.map((section) => (
            <div key={section.title} className="card p-4">
              <h3 className="section-title">{section.title}</h3>
              <dl className="mt-2 divide-y divide-line">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-start justify-between gap-4 py-2.5 text-sm"
                  >
                    <dt className="text-muted">{field.label}</dt>
                    <dd className="text-right font-medium">{display(field, data[field.key])}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          <button type="button" className="btn-ghost w-full" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Editar dados de {pillar.short_name}
          </button>
        </>
      )}
    </div>
  );
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "" && value !== false;
}

function display(field: PillarField, value: unknown) {
  if (!hasValue(value)) return <span className="font-normal text-muted">—</span>;

  switch (field.type) {
    case "boolean":
      return value ? "Sim" : "Não";
    case "currency":
      return formatCurrency(Number(value));
    case "percent":
      return `${String(value).replace(".", ",")}%`;
    case "number":
      return `${Number(value).toLocaleString("pt-BR")}${field.unit ? ` ${field.unit}` : ""}`;
    case "date":
      return formatDate(String(value));
    default:
      return String(value);
  }
}

function FieldInput({ field, value }: { field: PillarField; value: unknown }) {
  const name = `campo_${field.key}`;
  const defaultValue = hasValue(value) ? String(value).replace(".", ",") : "";

  if (field.type === "boolean") {
    return (
      <label className="flex h-full items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
        <input
          type="checkbox"
          name={name}
          defaultChecked={Boolean(value)}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        <span className="text-sm">{field.label}</span>
      </label>
    );
  }

  return (
    <>
      <label className="label" htmlFor={name}>
        {field.label}
        {field.unit ? <span className="ml-1 text-muted">({field.unit})</span> : null}
      </label>

      {field.type === "longtext" ? (
        <textarea id={name} name={name} rows={3} className="input" defaultValue={defaultValue} />
      ) : field.type === "select" ? (
        <select id={name} name={name} className="input" defaultValue={defaultValue}>
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={field.type === "date" ? "date" : "text"}
          inputMode={
            field.type === "number" || field.type === "currency" || field.type === "percent"
              ? "decimal"
              : undefined
          }
          className="input"
          defaultValue={hasValue(value) ? String(value).replace(".", ",") : ""}
        />
      )}

      {field.hint ? <p className="mt-1 text-xs text-muted">{field.hint}</p> : null}
    </>
  );
}
