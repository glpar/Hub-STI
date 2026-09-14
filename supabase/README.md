# Banco de dados

O esquema completo — tabelas, políticas de segurança (RLS), buckets de arquivos e os
dados iniciais dos pilares — está em:

```
supabase/migrations/20260914120000_init.sql
```

## Jeito 1 — integração com o GitHub (automático)

Com o repositório conectado ao projeto no Supabase, os arquivos de `supabase/migrations/`
são aplicados sozinhos quando chegam na branch de produção. É só dar merge.

## Jeito 2 — colar no SQL Editor (manual, funciona sempre)

Abra o **SQL Editor** no painel do Supabase, cole todo o conteúdo do arquivo de migration
acima e execute.

## Jeito 3 — CLI

```bash
npx supabase link --project-ref <ref-do-seu-projeto>
npx supabase db push
```

## Pode rodar mais de uma vez

A migration é idempotente: usa `create table if not exists`, `drop policy if exists`
antes de cada policy e `on conflict do nothing` nos dados iniciais. Se você já colou o
esquema no SQL Editor antes, aplicar de novo pela integração não quebra nada.
