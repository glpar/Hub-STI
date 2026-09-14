"use client";

import { useState, useTransition } from "react";

import { Check, ChevronDown, CalendarRange } from "lucide-react";

import { selectCycle } from "@/app/(app)/actions";
import type { Cycle } from "@/lib/database.types";
import { formatDateRange } from "@/lib/format";

export function CycleSwitcher({
  cycles,
  current,
}: {
  cycles: Cycle[];
  current: Cycle | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function choose(cycleId: string) {
    setOpen(false);
    startTransition(() => {
      void selectCycle(cycleId);
    });
  }

  if (cycles.length === 0) {
    return (
      <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        Nenhum ciclo cadastrado
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-[60vw] items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold transition hover:bg-surface-2 sm:max-w-none"
        aria-expanded={open}
        aria-haspopup="listbox"
        data-pending={pending}
      >
        <CalendarRange className="h-4 w-4 shrink-0 text-muted" />
        <span className="truncate">{current?.name ?? "Escolher ciclo"}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
          >
            {cycles.map((cycle) => {
              const selected = cycle.id === current?.id;
              return (
                <li key={cycle.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => choose(cycle.id)}
                    className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2"
                  >
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${selected ? "text-primary" : "invisible"}`}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{cycle.name}</span>
                        {cycle.is_current ? (
                          <span className="pill bg-primary-soft text-primary">atual</span>
                        ) : null}
                      </span>
                      <span className="block text-xs text-muted">
                        {formatDateRange(cycle.start_date, cycle.end_date)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
