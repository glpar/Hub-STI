"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Building2, ChevronRight, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { pillarTheme } from "@/lib/constants";
import type { Company, Engagement, Pillar } from "@/lib/database.types";

import { CompanySheet } from "./company-sheet";

type Props = {
  companies: Company[];
  engagements: Engagement[];
  pillars: Pillar[];
  cycleId: string | null;
  cycleName: string | null;
};

export function CompanyList({ companies, engagements, pillars, cycleId, cycleName }: Props) {
  const [search, setSearch] = useState("");
  const [onlyCycle, setOnlyCycle] = useState(false);
  const [creating, setCreating] = useState(false);

  const byCompany = useMemo(() => {
    const map = new Map<string, Engagement[]>();
    for (const engagement of engagements) {
      const list = map.get(engagement.company_id) ?? [];
      list.push(engagement);
      map.set(engagement.company_id, list);
    }
    return map;
  }, [engagements]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return companies.filter((company) => {
      if (onlyCycle && cycleId) {
        const list = byCompany.get(company.id) ?? [];
        if (!list.some((item) => item.cycle_id === cycleId)) return false;
      }
      if (!term) return true;
      return [company.name, company.city, company.sector, company.cnpj]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [companies, search, onlyCycle, cycleId, byCompany]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Buscar por nome, cidade, setor…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova empresa</span>
        </button>
      </div>

      {cycleId ? (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm">
          <input
            type="checkbox"
            checked={onlyCycle}
            onChange={(event) => setOnlyCycle(event.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Só as do ciclo {cycleName}
        </label>
      ) : null}

      <p className="text-sm text-muted">
        {filtered.length} empresa{filtered.length === 1 ? "" : "s"}
        {onlyCycle ? ` no ciclo ${cycleName}` : " cadastradas"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma empresa encontrada"
          description={
            search ? "Tente outro termo de busca." : "Cadastre a primeira empresa do time."
          }
          action={
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Nova empresa
            </button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((company) => {
            const list = byCompany.get(company.id) ?? [];
            const inCycle = cycleId ? list.filter((item) => item.cycle_id === cycleId) : [];
            const pillarIds = [...new Set(inCycle.map((item) => item.pillar_id))];

            return (
              <li key={company.id}>
                <Link
                  href={`/empresas/${company.id}`}
                  className="card flex items-center gap-3 px-4 py-3.5 transition hover:border-line-strong"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                    <Building2 className="h-5 w-5 text-muted" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{company.name}</p>
                    <p className="truncate text-xs text-muted">
                      {[company.city && `${company.city}${company.state ? `/${company.state}` : ""}`, company.sector]
                        .filter(Boolean)
                        .join(" · ") || "Sem dados de localização"}
                    </p>
                    {pillarIds.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {pillarIds.map((pillarId) => {
                          const pillar = pillars.find((item) => item.id === pillarId);
                          if (!pillar) return null;
                          return (
                            <span key={pillarId} className={`pill ${pillarTheme(pillarId).soft}`}>
                              {pillar.short_name}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted">
                      {list.length} contrato{list.length === 1 ? "" : "s"}
                    </p>
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 text-muted" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CompanySheet
        open={creating}
        onClose={() => setCreating(false)}
        goToCompanyOnCreate
      />
    </div>
  );
}
