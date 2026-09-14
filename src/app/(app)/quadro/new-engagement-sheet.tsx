"use client";

import { useState } from "react";

import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { STATUS_META, STATUS_ORDER, UF_LIST } from "@/lib/constants";
import type { Company, Cycle, Pillar, Profile } from "@/lib/database.types";
import { useSheetAction } from "@/lib/use-sheet-action";

import { createEngagement } from "./actions";

const NEW_COMPANY = "__nova__";

export function NewEngagementSheet({
  open,
  onClose,
  cycle,
  companies,
  pillars,
  team,
  currentUserId,
  defaultPillar,
}: {
  open: boolean;
  onClose: () => void;
  cycle: Cycle;
  companies: Company[];
  pillars: Pillar[];
  team: Profile[];
  currentUserId: string;
  defaultPillar: string;
}) {
  const [companyChoice, setCompanyChoice] = useState("");
  const { submit, error } = useSheetAction(createEngagement, () => {
    setCompanyChoice("");
    onClose();
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nova empresa no quadro"
      description={`Entra no ciclo ${cycle.name}`}
    >
      <form action={submit} className="space-y-4">
        <input type="hidden" name="cycle_id" value={cycle.id} />

        <div>
          <label className="label" htmlFor="company">
            Empresa
          </label>
          <select
            id="company"
            className="input"
            value={companyChoice}
            onChange={(event) => setCompanyChoice(event.target.value)}
            name={companyChoice === NEW_COMPANY ? undefined : "company_id"}
            required
          >
            <option value="">Selecione…</option>
            <option value={NEW_COMPANY}>➕ Cadastrar nova empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
                {company.city ? ` — ${company.city}` : ""}
              </option>
            ))}
          </select>
        </div>

        {companyChoice === NEW_COMPANY ? (
          <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-3">
            <div>
              <label className="label" htmlFor="company_name">
                Nome da empresa
              </label>
              <input id="company_name" name="company_name" className="input" required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="label" htmlFor="company_city">
                  Cidade
                </label>
                <input id="company_city" name="company_city" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="company_state">
                  UF
                </label>
                <select id="company_state" name="company_state" className="input">
                  <option value="">—</option>
                  {UF_LIST.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pillar_id">
              Área contratada
            </label>
            <select
              id="pillar_id"
              name="pillar_id"
              className="input"
              defaultValue={defaultPillar}
              required
            >
              <option value="">Selecione…</option>
              {pillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>
                  {pillar.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">É esta a meta que vai contar.</p>
          </div>

          <div>
            <label className="label" htmlFor="status">
              Situação
            </label>
            <select id="status" name="status" className="input" defaultValue="prospeccao">
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-3">
          <p className="text-xs font-semibold">Quem trouxe essa empresa?</p>
          <p className="-mt-2 text-xs leading-relaxed text-muted">
            Se alguém do Lean levou uma venda de Eficiência Energética, registre aqui. O contrato
            conta para a meta da área contratada, e a origem fica registrada sem bagunçar os
            números.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="sourced_by_id">
                Pessoa
              </label>
              <select id="sourced_by_id" name="sourced_by_id" className="input" defaultValue="">
                <option value="">—</option>
                {team.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sourced_pillar_id">
                Área de origem
              </label>
              <select
                id="sourced_pillar_id"
                name="sourced_pillar_id"
                className="input"
                defaultValue=""
              >
                <option value="">—</option>
                {pillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>
                    {pillar.short_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="owner_id">
              Responsável
            </label>
            <select id="owner_id" name="owner_id" className="input" defaultValue={currentUserId}>
              <option value="">—</option>
              {team.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || person.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="value">
              Valor do contrato (R$)
            </label>
            <input
              id="value"
              name="value"
              inputMode="decimal"
              className="input"
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="contract_date">
            Data do contrato
          </label>
          <input id="contract_date" name="contract_date" type="date" className="input" />
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Observações
          </label>
          <textarea id="notes" name="notes" rows={3} className="input" />
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
          <SubmitButton className="btn-primary flex-1">Adicionar</SubmitButton>
        </div>
      </form>
    </Sheet>
  );
}
