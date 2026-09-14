"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Building2, Trash2 } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { STATUS_META, STATUS_ORDER } from "@/lib/constants";
import type { Company, Engagement, Pillar, Profile } from "@/lib/database.types";
import { useSheetAction } from "@/lib/use-sheet-action";

import { deleteEngagement, updateEngagement } from "./actions";

export function EngagementSheet({
  engagement,
  company,
  pillars,
  team,
  onClose,
}: {
  engagement: Engagement | null;
  company: Company | undefined;
  pillars: Pillar[];
  team: Profile[];
  onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const { submit, error } = useSheetAction(updateEngagement, onClose);

  if (!engagement) return null;

  const pillar = pillars.find((item) => item.id === engagement.pillar_id);

  return (
    <Sheet
      open
      onClose={onClose}
      title={company?.name ?? "Empresa"}
      description={`${pillar?.name ?? "Área"} · ${STATUS_META[engagement.status].label}`}
    >
      <form action={submit} className="space-y-4">
        <input type="hidden" name="id" value={engagement.id} />

        {company ? (
          <Link
            href={`/empresas/${company.id}`}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm font-semibold transition hover:border-line-strong"
          >
            <Building2 className="h-4 w-4 text-muted" />
            Ver ficha completa da empresa
          </Link>
        ) : null}

        <div>
          <label className="label" htmlFor="edit-status">
            Situação
          </label>
          <select
            id="edit-status"
            name="status"
            className="input"
            defaultValue={engagement.status}
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="edit-owner">
              Responsável
            </label>
            <select
              id="edit-owner"
              name="owner_id"
              className="input"
              defaultValue={engagement.owner_id ?? ""}
            >
              <option value="">—</option>
              {team.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || person.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="edit-value">
              Valor (R$)
            </label>
            <input
              id="edit-value"
              name="value"
              inputMode="decimal"
              className="input"
              defaultValue={engagement.value ? String(engagement.value).replace(".", ",") : ""}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="edit-sourced-by">
              Quem trouxe
            </label>
            <select
              id="edit-sourced-by"
              name="sourced_by_id"
              className="input"
              defaultValue={engagement.sourced_by_id ?? ""}
            >
              <option value="">—</option>
              {team.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || person.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="edit-sourced-pillar">
              Área de origem
            </label>
            <select
              id="edit-sourced-pillar"
              name="sourced_pillar_id"
              className="input"
              defaultValue={engagement.sourced_pillar_id ?? ""}
            >
              <option value="">—</option>
              {pillars.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.short_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="edit-contract-date">
              Contrato
            </label>
            <input
              id="edit-contract-date"
              name="contract_date"
              type="date"
              className="input"
              defaultValue={engagement.contract_date ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-start">
              Início
            </label>
            <input
              id="edit-start"
              name="start_date"
              type="date"
              className="input"
              defaultValue={engagement.start_date ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-end">
              Término
            </label>
            <input
              id="edit-end"
              name="end_date"
              type="date"
              className="input"
              defaultValue={engagement.end_date ?? ""}
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
          <input
            type="checkbox"
            name="counts_toward_goal"
            defaultChecked={engagement.counts_toward_goal}
            className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          />
          <span className="text-sm">
            Conta para a meta
            <span className="block text-xs text-muted">
              Desmarque em casos especiais (renovação, cortesia, contrato de outra unidade).
            </span>
          </span>
        </label>

        <div>
          <label className="label" htmlFor="edit-notes">
            Observações
          </label>
          <textarea
            id="edit-notes"
            name="notes"
            rows={3}
            className="input"
            defaultValue={engagement.notes ?? ""}
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Fechar
          </button>
          <SubmitButton className="btn-primary flex-1">Salvar</SubmitButton>
        </div>
      </form>

      <div className="mt-4 border-t border-line pt-4">
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">
              Remover este registro do quadro? A empresa continua cadastrada.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger flex-1"
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    await deleteEngagement(engagement.id);
                    onClose();
                  })
                }
              >
                Remover mesmo
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-danger w-full"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Remover do quadro
          </button>
        )}
      </div>
    </Sheet>
  );
}
