import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";

import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { proximo } = await searchParams;

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse com seu e-mail e senha"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-primary">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm next={proximo ?? "/"} />
    </AuthShell>
  );
}
