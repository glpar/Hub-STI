import { BottomNav } from "@/components/shell/bottom-nav";
import { CycleSwitcher } from "@/components/shell/cycle-switcher";
import { Sidebar } from "@/components/shell/sidebar";
import { UserMenu } from "@/components/shell/user-menu";
import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseEnv } from "@/lib/env";
import { getSessionContext } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) return <SetupNotice />;

  const { profile, pillars, cycles, cycle } = await getSessionContext();
  const pillarName = pillars.find((item) => item.id === profile.pillar_id)?.name ?? null;

  return (
    <div className="min-h-dvh lg:pl-60 print:pl-0">
      <Sidebar isAdmin={profile.role === "admin"} />

      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base text-primary-fg">
              ⚡
            </span>
            <span className="text-base font-bold tracking-tight">Hub STI</span>
          </span>

          <div className="ml-auto flex items-center gap-2">
            <CycleSwitcher cycles={cycles} current={cycle} />
            <UserMenu profile={profile} pillarName={pillarName} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 print:max-w-none print:p-0">{children}</main>

      <BottomNav />
    </div>
  );
}
