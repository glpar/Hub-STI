"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Loader2, MailCheck } from "lucide-react";

import { PILLAR_FALLBACK } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pillarId, setPillarId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Já existe uma conta com esse e-mail."
          : signUpError.message,
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    if (pillarId) {
      await supabase
        .from("profiles")
        .update({ pillar_id: pillarId })
        .eq("id", data.session.user.id);
    }

    router.replace("/");
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <div className="space-y-3 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-primary" />
        <p className="font-semibold">Confirme seu e-mail</p>
        <p className="text-sm text-muted">
          Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar,
          volte e faça login.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="fullName">
          Nome completo
        </label>
        <input
          id="fullName"
          required
          autoComplete="name"
          className="input"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Maria Silva"
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu.nome@empresa.com"
        />
      </div>

      <div>
        <label className="label" htmlFor="pillar">
          Sua área
        </label>
        <select
          id="pillar"
          className="input"
          value={pillarId}
          onChange={(event) => setPillarId(event.target.value)}
        >
          <option value="">Selecione…</option>
          {PILLAR_FALLBACK.map((pillar) => (
            <option key={pillar.id} value={pillar.id}>
              {pillar.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">
          Define quais dados técnicos aparecem primeiro para você nas empresas.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Criar conta
      </button>
    </form>
  );
}
