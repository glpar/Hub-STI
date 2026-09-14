"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Loader2, Paperclip, Upload } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import type { Company, Cycle, Profile } from "@/lib/database.types";
import { formatFileSize } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

import { registerDocument } from "./actions";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export function UploadSheet({
  open,
  onClose,
  companies,
  cycles,
  team,
  currentUserId,
  defaultCycleId,
}: {
  open: boolean;
  onClose: () => void;
  companies: Company[];
  cycles: Cycle[];
  team: Profile[];
  currentUserId: string;
  defaultCycleId: string | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"all" | "specific">("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const others = team.filter((person) => person.id !== currentUserId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("O arquivo passa de 50 MB. Compacte ou envie por partes.");
      return;
    }

    setBusy(true);
    setError(null);

    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${currentUserId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(`Falha no envio: ${uploadError.message}`);
      setBusy(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("storage_path", path);
    formData.set("mime_type", file.type);
    formData.set("size_bytes", String(file.size));
    if (!formData.get("name")) formData.set("name", file.name);

    const result = await registerDocument({}, formData);

    if (result.error) {
      await supabase.storage.from("documentos").remove([path]);
      setError(result.error);
      setBusy(false);
      return;
    }

    formRef.current?.reset();
    setFile(null);
    setVisibility("all");
    setBusy(false);
    onClose();
    router.refresh();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Enviar arquivo"
      description="Escolha se é para todo mundo ou só para algumas pessoas"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface-2 px-4 py-8 text-center transition hover:border-primary">
          <Paperclip className="h-7 w-7 text-muted" />
          {file ? (
            <>
              <span className="text-sm font-semibold">{file.name}</span>
              <span className="text-xs text-muted">{formatFileSize(file.size)}</span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">Toque para escolher um arquivo</span>
              <span className="text-xs text-muted">Até 50 MB</span>
            </>
          )}
          <input
            type="file"
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </label>

        <div>
          <label className="label" htmlFor="name">
            Nome que aparece na lista
          </label>
          <input
            id="name"
            name="name"
            className="input"
            placeholder={file?.name ?? "Relatório de diagnóstico"}
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Descrição (opcional)
          </label>
          <textarea id="description" name="description" rows={2} className="input" />
        </div>

        <fieldset>
          <legend className="label">Quem pode ver</legend>
          <div className="grid grid-cols-2 gap-2">
            <VisibilityOption
              active={visibility === "all"}
              onClick={() => setVisibility("all")}
              title="Todo mundo"
              description="Toda a equipe"
            />
            <VisibilityOption
              active={visibility === "specific"}
              onClick={() => setVisibility("specific")}
              title="Só algumas pessoas"
              description="Você escolhe"
            />
          </div>
          <input type="hidden" name="visibility" value={visibility} />
        </fieldset>

        {visibility === "specific" ? (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line bg-surface-2 p-2">
            {others.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted">
                Ainda não há outras pessoas cadastradas.
              </p>
            ) : (
              others.map((person) => (
                <label
                  key={person.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-surface"
                >
                  <input
                    type="checkbox"
                    name="recipients"
                    value={person.id}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="text-sm">{person.full_name || person.email}</span>
                </label>
              ))
            )}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="company_id">
              Empresa (opcional)
            </label>
            <select id="company_id" name="company_id" className="input" defaultValue="">
              <option value="">—</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cycle_id">
              Ciclo (opcional)
            </label>
            <select
              id="cycle_id"
              name="cycle_id"
              className="input"
              defaultValue={defaultCycleId ?? ""}
            >
              <option value="">—</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function VisibilityOption({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-left transition ${
        active ? "border-primary bg-primary-soft" : "border-line bg-surface hover:bg-surface-2"
      }`}
    >
      <span className={`block text-sm font-semibold ${active ? "text-primary" : ""}`}>
        {title}
      </span>
      <span className="block text-xs text-muted">{description}</span>
    </button>
  );
}
