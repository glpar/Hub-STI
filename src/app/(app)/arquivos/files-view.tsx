"use client";

import { useMemo, useState, useTransition } from "react";

import {
  Download,
  FileText,
  FolderOpen,
  Globe2,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import type {
  Company,
  Cycle,
  DocumentRecipient,
  DocumentRow,
  Profile,
} from "@/lib/database.types";
import { formatDate, formatFileSize } from "@/lib/format";

import { deleteDocument, getDownloadUrl } from "./actions";
import { UploadSheet } from "./upload-sheet";

type Filter = "todos" | "para_mim" | "meus";

export function FilesView({
  documents,
  recipients,
  companies,
  cycles,
  team,
  currentUser,
  defaultCycleId,
}: {
  documents: DocumentRow[];
  recipients: DocumentRecipient[];
  companies: Company[];
  cycles: Cycle[];
  team: Profile[];
  currentUser: Profile;
  defaultCycleId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [uploading, setUploading] = useState(false);

  const recipientsByDoc = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of recipients) {
      const list = map.get(row.document_id) ?? [];
      list.push(row.user_id);
      map.set(row.document_id, list);
    }
    return map;
  }, [recipients]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter((document) => {
      if (filter === "meus" && document.uploaded_by !== currentUser.id) return false;
      if (filter === "para_mim") {
        const list = recipientsByDoc.get(document.id) ?? [];
        if (!list.includes(currentUser.id)) return false;
      }
      if (!term) return true;
      return (
        document.name.toLowerCase().includes(term) ||
        document.description?.toLowerCase().includes(term)
      );
    });
  }, [documents, filter, search, currentUser.id, recipientsByDoc]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Buscar arquivo…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setUploading(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Enviar arquivo</span>
        </button>
      </div>

      <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {(
          [
            ["todos", "Todos"],
            ["para_mim", "Para mim"],
            ["meus", "Enviei"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              filter === value ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nenhum arquivo por aqui"
          description="Envie relatórios, planilhas e apresentações para o time."
          action={
            <button type="button" className="btn-primary" onClick={() => setUploading(true)}>
              <Plus className="h-4 w-4" />
              Enviar arquivo
            </button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((document) => (
            <FileRow
              key={document.id}
              document={document}
              recipientIds={recipientsByDoc.get(document.id) ?? []}
              team={team}
              companies={companies}
              currentUser={currentUser}
            />
          ))}
        </ul>
      )}

      <UploadSheet
        open={uploading}
        onClose={() => setUploading(false)}
        companies={companies}
        cycles={cycles}
        team={team}
        currentUserId={currentUser.id}
        defaultCycleId={defaultCycleId}
      />
    </div>
  );
}

function FileRow({
  document,
  recipientIds,
  team,
  companies,
  currentUser,
}: {
  document: DocumentRow;
  recipientIds: string[];
  team: Profile[];
  companies: Company[];
  currentUser: Profile;
}) {
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploader = team.find((person) => person.id === document.uploaded_by);
  const company = companies.find((item) => item.id === document.company_id);
  const canDelete = document.uploaded_by === currentUser.id || currentUser.role === "admin";

  const sharedWith = recipientIds
    .map((id) => team.find((person) => person.id === id)?.full_name)
    .filter(Boolean)
    .join(", ");

  async function download() {
    setDownloading(true);
    setError(null);
    const result = await getDownloadUrl(document.storage_path);
    setDownloading(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if ("url" in result && result.url) window.open(result.url, "_blank", "noopener");
  }

  return (
    <li className="card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
          <FileText className="h-5 w-5 text-muted" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{document.name}</p>
          {document.description ? (
            <p className="mt-0.5 text-sm text-muted">{document.description}</p>
          ) : null}

          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
            <span>{formatFileSize(document.size_bytes)}</span>
            <span>·</span>
            <span>{formatDate(document.created_at.slice(0, 10))}</span>
            {uploader ? (
              <>
                <span>·</span>
                <span>por {uploader.full_name || uploader.email}</span>
              </>
            ) : null}
            {company ? (
              <>
                <span>·</span>
                <span>{company.name}</span>
              </>
            ) : null}
          </p>

          <p className="mt-1.5">
            {document.visibility === "all" ? (
              <span className="pill bg-surface-2 text-muted">
                <Globe2 className="h-3 w-3" />
                Todo mundo
              </span>
            ) : (
              <span className="pill bg-surface-2 text-muted" title={sharedWith}>
                <Users className="h-3 w-3" />
                {sharedWith || `${recipientIds.length} pessoa(s)`}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-primary"
            aria-label="Baixar arquivo"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-rose-600"
              aria-label="Excluir arquivo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}

      {confirming ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-950/40">
          <p className="flex-1 text-sm text-rose-700 dark:text-rose-300">Excluir este arquivo?</p>
          <button
            type="button"
            className="text-sm font-semibold text-muted"
            onClick={() => setConfirming(false)}
          >
            Não
          </button>
          <button
            type="button"
            disabled={pending}
            className="text-sm font-semibold text-rose-700 dark:text-rose-300"
            onClick={() =>
              startTransition(async () => {
                await deleteDocument(document.id, document.storage_path);
              })
            }
          >
            Excluir
          </button>
        </div>
      ) : null}
    </li>
  );
}
