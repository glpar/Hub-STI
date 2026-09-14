# Hub STI

Sistema interno da equipe de **Eficiência Energética**, **Lean** e **Transformação Digital**
para acompanhar metas, ciclos, empresas atendidas, viagens e arquivos.

Feito **mobile first**: funciona no celular, no computador e fora da rede do trabalho.

---

## O que ele resolve

O problema principal era simples de descrever e difícil de responder no dia a dia:
_"quantas empresas já fecharam e quantas ainda faltam para bater a meta?"_ — sobretudo quando
alguém de uma área leva uma venda de outra.

A regra que o sistema usa:

- Cada empresa pode ter **um registro por área, por ciclo**. Uma mesma empresa pode entrar em
  Eficiência Energética **e** em Lean no mesmo ciclo — são dois contratos, uma empresa.
- O banco **impede** dois registros da mesma empresa, na mesma área, no mesmo ciclo. Ou seja:
  ninguém conta a mesma venda duas vezes.
- Quando o pessoal do Lean leva uma venda de Eficiência Energética, o registro é criado na área
  **Eficiência Energética** (é a meta que conta) e a origem fica marcada em
  _"quem trouxe"_ e _"área de origem"_. O crédito aparece sem inflar o número da outra área.
- Conta para a meta quem está em **Contratada**, **Em execução** ou **Finalizada**.
  _Em prospecção_ e _Em negociação_ aparecem como "em aberto" — dá para ver quanto ainda
  pode virar meta.
- Existe uma chave de escape: o campo **"conta para a meta"** pode ser desmarcado em casos
  especiais (renovação, cortesia, contrato de outra unidade).

O painel mostra sempre no formato `X/Y` com o "faltam Z" do lado — por ciclo e por ano.

---

## Telas

| Tela | O que tem |
| --- | --- |
| **Início** | Meta do ciclo e do ano, `X/Y` por área, quanto falta, resumo do quadro, próximas viagens e arquivos recentes. Seletor de ano para comparar com o ano passado. |
| **Quadro** | Kanban com as colunas Prospecção → Negociação → Contratada → Execução → Finalizada (+ Não fechou). Arrasta e solta, filtra por área, com o contador `X/Y` no topo. |
| **Empresas** | Lista com busca, ficha completa e **abas por área** — cada pessoa vê primeiro os dados técnicos do seu pilar (consumo kWh, horas de consultoria, maturidade digital…). |
| **Ficha de visita técnica** | Só para Eficiência Energética. As 16 seções do formulário oficial do SENAI, importação da planilha de fatura, gráficos de consumo e anexo de fotos. Gera o relatório pronto para imprimir. |
| **Viagens** | Agenda compartilhada em lista ou calendário, com participantes, empresa e observações. |
| **Arquivos** | Upload com escolha de quem vê: **todo mundo** ou **só algumas pessoas**. |
| **Metas e ciclos** | (admin) Cria os ciclos do ano e define a meta de empresas e de valor por área. |
| **Equipe** | (admin) Define a área e a permissão de cada pessoa. |

---

## Ficha de visita técnica (Eficiência Energética)

Aparece na aba **Eficiência Energética** da empresa, em _Ficha de visita técnica_.

**Seções 1 a 4 são obrigatórias** e ficam sempre disponíveis:

1. Dados da empresa
2. Caracterização da operação
3. Dados do fornecimento
4. Histórico de consumo — 12 meses

**Da 5 em diante é tudo opcional.** Cada seção tem uma chavinha: o consultor liga só as que
for usar naquela visita (iluminação, climatização, refrigeração, motores, hábitos,
oportunidades, encerramento…). O que ficar desligado não aparece no relatório.

### Importar a planilha de fatura

Na seção 4 há o botão **Escolher planilha**. Ele lê a planilha padrão de fatura
(aba `1. BASE`) e preenche de uma vez:

- os 12 meses de consumo (kWh), tarifa e valor;
- energia reativa, quando houver;
- energia ativa injetada e o saldo, quando a planilha indicar geração distribuída;
- razão social, nº da UC e modalidade tarifária, que caem nas seções 1 e 3.

A leitura é feita pelos **rótulos** da planilha, não por posição de célula, então pequenas
mudanças de layout não quebram a importação.

### A chavinha "Existe GD na unidade?"

Ligando essa chave (ou importando uma planilha que já tenha geração), entram:

- os campos de **energia injetada** e **tarifa de injeção** no histórico mês a mês;
- o campo de **potência instalada (kWp)**;
- o gráfico **Consumo x energia injetada** no relatório, com o texto de análise sugerido a
  partir da diferença entre consumo e geração.

Sem GD, o relatório sai só com o gráfico de consumo.

### Fotos

Toda seção tem um botão **Anexar foto**. As imagens vão para um bucket privado do Supabase,
recebem legenda e saem no relatório junto da seção correspondente. A seção 14 lista todas em
ordem, como o registro de evidências da ficha impressa.

### Relatório

O botão **Ver relatório** monta o documento com capa, apresentação, resumo executivo,
objetivo, normas aplicáveis, justificativa, metodologia, caracterização da empresa, perfil de
consumo com os gráficos e, depois, apenas as seções que foram ligadas. O botão
**Imprimir / salvar PDF** usa a impressão do próprio navegador, com estilo de impressão
próprio (sem menus, sem cortar gráfico no meio da página).

---

## Como colocar no ar

### 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um novo projeto, de preferência na região **South America (São Paulo)**.
3. Guarde a senha do banco que ele pedir.

### 2. Criar as tabelas

No painel do Supabase, abra **SQL Editor → New query**, cole **todo** o conteúdo de
[`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.

Isso cria as tabelas, as regras de permissão (RLS), o bucket de arquivos `documentos`
e já cadastra os três pilares.

> O arquivo pode ser executado de novo a qualquer momento sem quebrar nada.

### 3. Ajustar o login

Em **Authentication → Providers → Email**, decida se quer exigir confirmação de e-mail:

- **Uso interno, mais simples:** desligue _Confirm email_. A pessoa cria a conta e já entra.
- **Mais seguro:** mantenha ligado. Cada pessoa confirma pelo link que chega no e-mail.

### 4. Configurar as chaves no projeto

```bash
cp .env.example .env.local
```

Em **Project Settings → API** copie:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Rodar

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

**A primeira pessoa que criar conta vira administradora automaticamente.** Depois é só ela
liberar as outras em _Equipe_.

### 6. Publicar (para acessar do celular, fora do trabalho)

1. Suba o repositório no GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Em **Environment Variables**, cole as duas mesmas chaves do `.env.local`.
4. Deploy. A Vercel devolve um endereço `https://…vercel.app`.
5. No celular, abra o endereço e use **"Adicionar à tela de início"** — ele abre como aplicativo.

---

## Primeiros passos dentro do sistema

1. **Metas e ciclos** → crie o ciclo (ex.: _Ciclo 2026.1_) e marque como **ciclo atual**.
2. Ainda em Metas → **Definir metas**: quantas empresas cada área precisa fechar no ciclo.
3. **Meta anual**: o número do ano inteiro, por área.
4. **Quadro** → _Nova empresa no quadro_ para começar a lançar.

---

## Estrutura do projeto

```
src/
  app/
    entrar/            login
    cadastro/          criação de conta
    (app)/             tudo que exige login
      page.tsx         painel inicial
      quadro/          kanban
      empresas/        lista + ficha com abas por pilar
      viagens/         agenda e calendário
      arquivos/        upload e compartilhamento
      metas/           ciclos e metas (admin)
      equipe/          permissões (admin)
      ficha/           ficha de visita técnica + relatório
  components/
    charts/            gráficos de energia em SVG
  components/          shell de navegação e kit de interface
  lib/
    constants.ts       status do quadro, cores dos pilares
    pillar-fields.ts   campos técnicos de cada área
    visit-form.ts      as 16 seções da ficha de visita técnica
    fatura-import.ts   leitura da planilha de fatura (.xlsx)
    energy.ts          histórico de consumo e indicadores derivados
    report-texts.ts    textos padrão do relatório
    stats.ts           o cálculo do X/Y e do "quanto falta"
    queries.ts         consultas ao banco
supabase/
  schema.sql           banco, permissões e dados iniciais
```

### Mudar as seções ou os campos da ficha

As 16 seções e todos os seus campos estão em
[`src/lib/visit-form.ts`](src/lib/visit-form.ts). Como as respostas são gravadas em `jsonb`,
dá para **acrescentar, remover ou renomear campos sem mexer no banco**. Para tornar uma seção
obrigatória, basta trocar `required: false` por `required: true`.

### Mudar os campos técnicos de uma área

Todos os campos de Eficiência Energética, Lean e Transformação Digital ficam em
[`src/lib/pillar-fields.ts`](src/lib/pillar-fields.ts). Eles são salvos em uma coluna `jsonb`,
então dá para **adicionar, remover ou renomear campos sem mexer no banco**.

---

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage)
