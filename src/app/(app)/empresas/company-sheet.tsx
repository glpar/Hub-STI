"use client";

import { useRouter } from "next/navigation";


import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { UF_LIST } from "@/lib/constants";
import type { Company } from "@/lib/database.types";
import { useSheetAction } from "@/lib/use-sheet-action";

import { createCompany, updateCompany } from "./actions";

export function CompanySheet({
  open,
  onClose,
  company,
  goToCompanyOnCreate = false,
}: {
  open: boolean;
  onClose: () => void;
  company?: Company;
  goToCompanyOnCreate?: boolean;
}) {
  const router = useRouter();
  const { submit, error } = useSheetAction(
    company ? updateCompany : createCompany,
    (result) => {
      onClose();
      if (goToCompanyOnCreate && result.id && !company) router.push(`/empresas/${result.id}`);
    },
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={company ? "Editar empresa" : "Nova empresa"}
      description="Dados de cadastro e contato"
    >
      <form action={submit} className="space-y-4">
        {company ? <input type="hidden" name="id" value={company.id} /> : null}

        <div>
          <label className="label" htmlFor="name">
            Nome da empresa
          </label>
          <input
            id="name"
            name="name"
            className="input"
            required
            defaultValue={company?.name ?? ""}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cnpj">
              CNPJ
            </label>
            <input
              id="cnpj"
              name="cnpj"
              inputMode="numeric"
              className="input"
              placeholder="00.000.000/0000-00"
              defaultValue={company?.cnpj ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="sector">
              Setor / segmento
            </label>
            <input
              id="sector"
              name="sector"
              className="input"
              placeholder="Metalmecânica, alimentos…"
              defaultValue={company?.sector ?? ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label" htmlFor="city">
              Cidade
            </label>
            <input id="city" name="city" className="input" defaultValue={company?.city ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="state">
              UF
            </label>
            <select
              id="state"
              name="state"
              className="input"
              defaultValue={company?.state ?? ""}
            >
              <option value="">—</option>
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-3">
          <p className="text-xs font-semibold">Contato na empresa</p>
          <div>
            <label className="label" htmlFor="contact_name">
              Nome
            </label>
            <input
              id="contact_name"
              name="contact_name"
              className="input"
              defaultValue={company?.contact_name ?? ""}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="contact_email">
                E-mail
              </label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                inputMode="email"
                className="input"
                defaultValue={company?.contact_email ?? ""}
              />
            </div>
            <div>
              <label className="label" htmlFor="contact_phone">
                Telefone
              </label>
              <input
                id="contact_phone"
                name="contact_phone"
                inputMode="tel"
                className="input"
                defaultValue={company?.contact_phone ?? ""}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Observações gerais
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="input"
            defaultValue={company?.notes ?? ""}
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
            {company ? "Salvar" : "Cadastrar"}
          </SubmitButton>
        </div>
      </form>
    </Sheet>
  );
}
