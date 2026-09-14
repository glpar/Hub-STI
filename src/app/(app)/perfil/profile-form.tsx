"use client";

import { useActionState } from "react";

import { CheckCircle2 } from "lucide-react";

import { SubmitButton } from "@/components/ui/submit-button";
import type { Pillar, Profile } from "@/lib/database.types";

import { changePassword, updateProfile, type ActionState } from "./actions";

export function ProfileForm({ profile, pillars }: { profile: Profile; pillars: Pillar[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateProfile, {});
  const [passwordState, passwordAction] = useActionState<ActionState, FormData>(
    changePassword,
    {},
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="card space-y-4 p-4">
        <h2 className="section-title">Meus dados</h2>

        <div>
          <label className="label" htmlFor="full_name">
            Nome completo
          </label>
          <input
            id="full_name"
            name="full_name"
            className="input"
            required
            defaultValue={profile.full_name}
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input id="email" className="input" value={profile.email} disabled readOnly />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              name="phone"
              inputMode="tel"
              className="input"
              defaultValue={profile.phone ?? ""}
            />
          </div>
          <div>
            <label className="label" htmlFor="pillar_id">
              Minha área
            </label>
            <select
              id="pillar_id"
              name="pillar_id"
              className="input"
              defaultValue={profile.pillar_id ?? ""}
            >
              <option value="">—</option>
              {pillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>
                  {pillar.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              É a aba que abre primeiro na ficha das empresas.
            </p>
          </div>
        </div>

        {state.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Dados salvos.
          </p>
        ) : null}

        <SubmitButton className="btn-primary w-full sm:w-auto">Salvar</SubmitButton>
      </form>

      <form action={passwordAction} className="card space-y-4 p-4">
        <h2 className="section-title">Trocar senha</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">
              Nova senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="input"
              minLength={6}
            />
          </div>
          <div>
            <label className="label" htmlFor="password_confirm">
              Repetir a nova senha
            </label>
            <input
              id="password_confirm"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              className="input"
              minLength={6}
            />
          </div>
        </div>

        {passwordState.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {passwordState.error}
          </p>
        ) : null}
        {passwordState.ok ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Senha alterada.
          </p>
        ) : null}

        <SubmitButton className="btn-ghost w-full sm:w-auto">Alterar senha</SubmitButton>
      </form>
    </div>
  );
}
