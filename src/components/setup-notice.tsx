const STEPS = [
  {
    title: "Crie um projeto no Supabase",
    body: "Acesse supabase.com, crie uma conta gratuita e um novo projeto. Escolha a região South America (São Paulo).",
  },
  {
    title: "Rode o arquivo supabase/schema.sql",
    body: "No painel do Supabase, abra o SQL Editor, cole todo o conteúdo do arquivo supabase/schema.sql deste projeto e execute.",
  },
  {
    title: "Copie as chaves para o .env.local",
    body: "Em Project Settings → API, copie a Project URL e a chave anon public para o arquivo .env.local (use o .env.example como modelo).",
  },
  {
    title: "Reinicie o servidor",
    body: "Pare e rode npm run dev de novo. A primeira pessoa que criar conta vira administradora automaticamente.",
  },
];

export function SetupNotice() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl text-primary-fg">
          ⚡
        </span>
        <span className="text-2xl font-bold tracking-tight">Hub STI</span>
      </div>

      <div className="card p-5">
        <h1 className="text-lg font-bold">Falta conectar o banco de dados</h1>
        <p className="mt-1 text-sm text-muted">
          O sistema está instalado, mas ainda não sabe onde guardar os dados. São quatro passos,
          uma vez só:
        </p>

        <ol className="mt-5 space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-5 rounded-xl bg-surface-2 px-3 py-2.5 text-xs text-muted">
          O passo a passo completo, com as telas do Supabase e o deploy na Vercel, está no{" "}
          <strong className="text-fg">README.md</strong> do projeto.
        </p>
      </div>
    </main>
  );
}
