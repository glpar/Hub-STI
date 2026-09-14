"use client";

import Link from "next/link";
import { useState } from "react";

import { FileText, Mail, MapPin, Pencil, Phone, Plane, User } from "lucide-react";

import { PillarBadge, StatusPill } from "@/components/ui/badges";
import { pillarTheme } from "@/lib/constants";
import type {
  Company,
  Cycle,
  DocumentRow,
  Engagement,
  Pillar,
  Profile,
  Trip,
} from "@/lib/database.types";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/format";

import { CompanySheet } from "../company-sheet";
import { PillarPanel } from "./pillar-panel";

type Props = {
  company: Company;
  engagements: Engagement[];
  pillars: Pillar[];
  cycles: Cycle[];
  team: Profile[];
  documents: DocumentRow[];
  trips: Trip[];
  selectedCycleId: string | null;
  myPillarId: string | null;
};

export function CompanyDetail({
  company,
  engagements,
  pillars,
  cycles,
  team,
  documents,
  trips,
  selectedCycleId,
  myPillarId,
}: Props) {
  const [tab, setTab] = useState<string>(myPillarId ?? "geral");
  const [editing, setEditing] = useState(false);

  const totalValue = engagements
    .filter((item) => item.counts_toward_goal)
    .reduce((sum, item) => sum + Number(item.value ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">{company.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {company.city ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.city}
                  {company.state ? `/${company.state}` : ""}
                </span>
              ) : null}
              {company.sector ? <span>{company.sector}</span> : null}
              {company.cnpj ? <span>CNPJ {company.cnpj}</span> : null}
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost shrink-0 px-3"
            onClick={() => setEditing(true)}
            aria-label="Editar empresa"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {(company.contact_name || company.contact_email || company.contact_phone) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-sm">
            {company.contact_name ? (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted" />
                {company.contact_name}
              </span>
            ) : null}
            {company.contact_phone ? (
              <a
                href={`tel:${company.contact_phone.replace(/\D/g, "")}`}
                className="flex items-center gap-1.5 text-primary"
              >
                <Phone className="h-4 w-4" />
                {company.contact_phone}
              </a>
            ) : null}
            {company.contact_email ? (
              <a
                href={`mailto:${company.contact_email}`}
                className="flex items-center gap-1.5 truncate text-primary"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {company.contact_email}
              </a>
            ) : null}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <div className="rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] font-medium text-muted">Contratos</p>
            <p className="mt-0.5 text-base font-bold tabular-nums">{engagements.length}</p>
          </div>
          <div className="rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] font-medium text-muted">Valor total</p>
            <p className="mt-0.5 truncate text-base font-bold tabular-nums">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Abas por área */}
      <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabButton active={tab === "geral"} onClick={() => setTab("geral")} label="Visão geral" />
        {pillars.map((pillar) => {
          const has = engagements.some((item) => item.pillar_id === pillar.id);
          return (
            <TabButton
              key={pillar.id}
              active={tab === pillar.id}
              onClick={() => setTab(pillar.id)}
              label={pillar.short_name}
              pillarId={pillar.id}
              dim={!has}
            />
          );
        })}
      </div>

      {tab === "geral" ? (
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="section-title">Contratos por ciclo</h2>
            {engagements.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Esta empresa ainda não foi adicionada a nenhum ciclo.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {engagements.map((engagement) => {
                  const pillar = pillars.find((item) => item.id === engagement.pillar_id);
                  const cycle = cycles.find((item) => item.id === engagement.cycle_id);
                  const sourced = pillars.find(
                    (item) => item.id === engagement.sourced_pillar_id,
                  );

                  return (
                    <li key={engagement.id} className="flex items-start gap-3 py-3">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${pillarTheme(engagement.pillar_id).solid}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <PillarBadge pillar={pillar} short />
                          <StatusPill status={engagement.status} />
                          {!engagement.counts_toward_goal ? (
                            <span className="pill bg-surface-2 text-muted">fora da meta</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm">
                          {cycle?.name ?? "Sem ciclo"}
                          {engagement.contract_date
                            ? ` · contrato em ${formatDate(engagement.contract_date)}`
                            : ""}
                        </p>
                        {sourced && sourced.id !== engagement.pillar_id ? (
                          <p className="text-xs text-muted">
                            Trazida pela área de {sourced.short_name}
                          </p>
                        ) : null}
                        {engagement.notes ? (
                          <p className="mt-1 text-xs text-muted">{engagement.notes}</p>
                        ) : null}
                      </div>
                      {engagement.value > 0 ? (
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatCurrency(engagement.value)}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {company.notes ? (
            <section className="card p-4">
              <h2 className="section-title">Observações</h2>
              <p className="mt-2 whitespace-pre-line text-sm">{company.notes}</p>
            </section>
          ) : null}

          <section className="card p-4">
            <h2 className="section-title">Viagens ligadas a esta empresa</h2>
            {trips.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nenhuma viagem registrada.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {trips.map((trip) => (
                  <li key={trip.id} className="flex items-center gap-3 py-2.5">
                    <Plane className="h-4 w-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{trip.title}</p>
                      <p className="text-xs text-muted">
                        {formatDateRange(trip.start_date, trip.end_date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-title">Arquivos desta empresa</h2>
              <Link href="/arquivos" className="text-xs font-semibold text-primary">
                enviar arquivo
              </Link>
            </div>
            {documents.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nenhum arquivo vinculado.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {documents.map((document) => (
                  <li key={document.id} className="flex items-center gap-3 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-muted" />
                    <p className="min-w-0 flex-1 truncate text-sm">{document.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <PillarPanel
          company={company}
          pillar={pillars.find((item) => item.id === tab)!}
          engagements={engagements}
          cycles={cycles}
          team={team}
          selectedCycleId={selectedCycleId}
        />
      )}

      <CompanySheet open={editing} onClose={() => setEditing(false)} company={company} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  pillarId,
  dim = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  pillarId?: string;
  dim?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary-soft text-primary"
          : `border-line bg-surface hover:text-fg ${dim ? "text-muted/60" : "text-muted"}`
      }`}
    >
      {pillarId ? (
        <span className={`h-2 w-2 rounded-full ${pillarTheme(pillarId).solid}`} />
      ) : null}
      {label}
    </button>
  );
}
