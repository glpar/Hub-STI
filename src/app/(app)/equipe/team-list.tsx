"use client";

import { useState } from "react";

import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { pillarTheme } from "@/lib/constants";
import type { Pillar, Profile } from "@/lib/database.types";
import { initials } from "@/lib/format";
import { useSheetAction } from "@/lib/use-sheet-action";

import { updateTeamMember } from "../perfil/actions";

export function TeamList({
  team,
  pillars,
  currentUserId,
}: {
  team: Profile[];
  pillars: Pillar[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState<Profile | null>(null);

  return (
    <>
      <ul className="space-y-2">
        {team.map((person) => {
          const pillar = pillars.find((item) => item.id === person.pillar_id);
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => setEditing(person)}
                className="card flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:border-line-strong"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg">
                  {initials(person.full_name || person.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {person.full_name || person.email}
                    {person.id === currentUserId ? (
                      <span className="ml-1.5 text-xs font-normal text-muted">(você)</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted">{person.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pillar ? (
                      <span className={`pill ${pillarTheme(pillar.id).soft}`}>
                        {pillar.short_name}
                      </span>
                    ) : (
                      <span className="pill bg-surface-2 text-muted">sem área</span>
                    )}
                    {person.role === "admin" ? (
                      <span className="pill bg-primary-soft text-primary">administrador</span>
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {editing ? (
        <MemberSheet
          person={editing}
          pillars={pillars}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function MemberSheet({
  person,
  pillars,
  onClose,
}: {
  person: Profile;
  pillars: Pillar[];
  onClose: () => void;
}) {
  const { submit, error } = useSheetAction(updateTeamMember, onClose);

  return (
    <Sheet open onClose={onClose} title={person.full_name || person.email} description={person.email}>
      <form action={submit} className="space-y-4">
        <input type="hidden" name="id" value={person.id} />

        <div>
          <label className="label" htmlFor="pillar_id">
            Área
          </label>
          <select
            id="pillar_id"
            name="pillar_id"
            className="input"
            defaultValue={person.pillar_id ?? ""}
          >
            <option value="">—</option>
            {pillars.map((pillar) => (
              <option key={pillar.id} value={pillar.id}>
                {pillar.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="role">
            Permissão
          </label>
          <select id="role" name="role" className="input" defaultValue={person.role}>
            <option value="member">Membro — usa o sistema normalmente</option>
            <option value="admin">Administrador — também define metas e ciclos</option>
          </select>
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
          <SubmitButton className="btn-primary flex-1">Salvar</SubmitButton>
        </div>
      </form>
    </Sheet>
  );
}
