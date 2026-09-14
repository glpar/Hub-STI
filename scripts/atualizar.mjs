#!/usr/bin/env node
/**
 * npm run atualizar
 *
 * Puxa as novidades do GitHub, instala o que mudou e avisa se apareceu
 * migration nova para aplicar no Supabase.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const VERDE = "\x1b[32m";
const AMARELO = "\x1b[33m";
const VERMELHO = "\x1b[31m";
const AZUL = "\x1b[36m";

function titulo(texto) {
  console.log(`\n${BOLD}${texto}${RESET}`);
}

function ok(texto) {
  console.log(`${VERDE}✓${RESET} ${texto}`);
}

function aviso(texto) {
  console.log(`${AMARELO}!${RESET} ${texto}`);
}

function erro(texto) {
  console.log(`${VERMELHO}✗${RESET} ${texto}`);
}

function passo(texto) {
  console.log(`${DIM}→ ${texto}${RESET}`);
}

/** Roda um comando e devolve a saída. Lança se falhar. */
function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/** Roda mostrando a saída na tela (para npm install). */
function rodar(comando, args) {
  execFileSync(comando, args, { stdio: "inherit", shell: process.platform === "win32" });
}

function sair(codigo) {
  console.log();
  process.exit(codigo);
}

// ---------------------------------------------------------------------------

console.log(`${BOLD}${AZUL}Hub STI — atualizando${RESET}`);

// 1. É um repositório git?
try {
  git("rev-parse", "--is-inside-work-tree");
} catch {
  erro("Esta pasta não é um repositório git.");
  console.log(`  Clone o projeto com: ${BOLD}git clone https://github.com/glpar/Hub-STI.git${RESET}`);
  sair(1);
}

// 2. Tem alteração sua não salva?
const sujo = git("status", "--porcelain");
if (sujo) {
  titulo("Você tem alterações locais não salvas");
  console.log(sujo.split("\n").map((linha) => `  ${linha}`).join("\n"));
  console.log();
  aviso("Parei aqui para não passar por cima do seu trabalho.");
  console.log(`  Para descartar:  ${BOLD}git checkout .${RESET}`);
  console.log(`  Para guardar:    ${BOLD}git stash${RESET}`);
  sair(1);
}

const antes = git("rev-parse", "HEAD");
const branch = git("rev-parse", "--abbrev-ref", "HEAD");

// 3. Puxar
titulo(`Buscando novidades (branch ${branch})`);
try {
  git("fetch", "origin");
} catch {
  erro("Não consegui falar com o GitHub. Verifique sua internet.");
  sair(1);
}

try {
  git("merge", "--ff-only", `origin/${branch}`);
} catch {
  erro(`A branch ${branch} divergiu da do GitHub e não dá para atualizar direto.`);
  console.log(`  Chame o suporte ou rode: ${BOLD}git pull --rebase${RESET}`);
  sair(1);
}

const depois = git("rev-parse", "HEAD");

if (antes === depois) {
  ok("Já estava tudo atualizado.");
} else {
  const commits = git("log", "--oneline", `${antes}..${depois}`);
  const quantos = commits.split("\n").length;
  ok(`${quantos} ${quantos === 1 ? "novidade baixada" : "novidades baixadas"}:`);
  console.log(commits.split("\n").map((linha) => `    ${linha}`).join("\n"));
}

// 4. Dependências mudaram?
const mudou = (caminho) =>
  antes !== depois && git("diff", "--name-only", antes, depois).split("\n").includes(caminho);

if (antes === depois && existsSync("node_modules")) {
  passo("Dependências sem mudança, pulando a instalação.");
} else if (mudou("package.json") || mudou("package-lock.json") || !existsSync("node_modules")) {
  titulo("Instalando dependências");
  try {
    rodar("npm", ["install"]);
    ok("Dependências instaladas.");
  } catch {
    erro("A instalação falhou. Tente apagar a pasta node_modules e rodar de novo.");
    sair(1);
  }
} else {
  passo("Dependências sem mudança, pulando a instalação.");
}

// 5. Migration nova para aplicar no Supabase?
if (antes !== depois) {
  const alterados = git("diff", "--name-only", antes, depois)
    .split("\n")
    .filter((caminho) => caminho.startsWith("supabase/migrations/") && caminho.endsWith(".sql"));

  if (alterados.length > 0) {
    titulo("⚠  Tem mudança no banco de dados");
    console.log("  Abra o SQL Editor do Supabase, cole o conteúdo destes arquivos e execute:");
    console.log();
    for (const caminho of alterados) console.log(`    ${BOLD}${caminho}${RESET}`);
    console.log();
    console.log(`  ${DIM}Pode rodar mais de uma vez sem quebrar nada.${RESET}`);
  }
}

// 6. Configuração local no lugar?
if (!existsSync(".env.local")) {
  titulo("Falta configurar as chaves do Supabase");
  console.log(`  Copie o modelo:  ${BOLD}cp .env.example .env.local${RESET}`);
  console.log("  E preencha com a Project URL e a chave anon (Project Settings → API).");
}

titulo("Pronto");
console.log(`  Para abrir o sistema:  ${BOLD}npm run dev${RESET}`);
sair(0);
