"use client";

import Link from "next/link";
import { useState } from "react";

import { LogOut, Settings, Target, UserRound } from "lucide-react";

import { signOut } from "@/app/(app)/actions";
import type { Profile } from "@/lib/database.types";
import { initials } from "@/lib/format";

export function UserMenu({ profile, pillarName }: { profile: Profile; pillarName: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg"
        aria-label="Menu da conta"
        aria-expanded={open}
      >
        {initials(profile.full_name || profile.email)}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{profile.full_name || "Sem nome"}</p>
              <p className="truncate text-xs text-muted">{profile.email}</p>
              <p className="mt-1.5 flex flex-wrap gap-1">
                {pillarName ? (
                  <span className="pill bg-surface-2 text-muted">{pillarName}</span>
                ) : null}
                {profile.role === "admin" ? (
                  <span className="pill bg-primary-soft text-primary">administrador</span>
                ) : null}
              </p>
            </div>

            <div className="my-1 h-px bg-line" />

            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-surface-2"
            >
              <UserRound className="h-4 w-4 text-muted" />
              Meu perfil
            </Link>
            <Link
              href="/metas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-surface-2"
            >
              <Target className="h-4 w-4 text-muted" />
              Metas e ciclos
            </Link>
            {profile.role === "admin" ? (
              <Link
                href="/equipe"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-surface-2"
              >
                <Settings className="h-4 w-4 text-muted" />
                Equipe
              </Link>
            ) : null}

            <div className="my-1 h-px bg-line" />

            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
