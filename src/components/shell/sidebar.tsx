"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isActive } from "@/lib/nav";

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-3 py-5 lg:flex print:hidden">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg text-primary-fg">
          ⚡
        </span>
        <span className="text-lg font-bold tracking-tight">Hub STI</span>
      </Link>

      <nav className="flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {isAdmin ? (
            <li>
              <Link
                href="/equipe"
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive(pathname, "/equipe")
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <span className="flex h-[18px] w-[18px] items-center justify-center text-base">👥</span>
                Equipe
              </Link>
            </li>
          ) : null}
        </ul>
      </nav>

      <p className="px-3 text-[11px] leading-relaxed text-muted">
        Eficiência Energética · Lean · Transformação Digital
      </p>
    </aside>
  );
}
