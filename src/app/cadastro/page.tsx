import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";

import { SignupForm } from "./signup-form";

export const metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cada pessoa do time tem o seu próprio login"
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-primary">
            Entrar
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
