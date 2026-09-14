import {
  Building2,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  Plane,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Aparece na barra inferior do celular. */
  primary: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", shortLabel: "Início", icon: LayoutDashboard, primary: true },
  { href: "/quadro", label: "Quadro", shortLabel: "Quadro", icon: KanbanSquare, primary: true },
  { href: "/empresas", label: "Empresas", shortLabel: "Empresas", icon: Building2, primary: true },
  { href: "/viagens", label: "Viagens", shortLabel: "Viagens", icon: Plane, primary: true },
  { href: "/arquivos", label: "Arquivos", shortLabel: "Arquivos", icon: FolderOpen, primary: true },
  { href: "/metas", label: "Metas e ciclos", shortLabel: "Metas", icon: Target, primary: false },
  { href: "/perfil", label: "Meu perfil", shortLabel: "Perfil", icon: UserRound, primary: false },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
