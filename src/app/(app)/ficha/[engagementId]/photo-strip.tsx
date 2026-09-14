"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Camera, Loader2, Trash2 } from "lucide-react";

import type { TechnicalVisitPhoto } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

import { addVisitPhoto, deleteVisitPhoto, updatePhotoCaption } from "./actions";

const MAX_SIZE = 12 * 1024 * 1024; // 12 MB por foto

export type PhotoWithUrl = TechnicalVisitPhoto & { url: string | null };

export function PhotoStrip({
  visitId,
  engagementId,
  sectionId,
  photos,
  currentUserId,
}: {
  visitId: string;
  engagementId: string;
  sectionId: string;
  photos: PhotoWithUrl[];
  currentUserId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList) {
    setBusy(true);
    setError(null);

    const supabase = createClient();
    let position = photos.length;

    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        setError(`"${file.name}" passa de 12 MB e não foi enviada.`);
        continue;
      }

      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${currentUserId}/${visitId}/${sectionId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("ficha-fotos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setError(`Falha ao enviar "${file.name}": ${uploadError.message}`);
        continue;
      }

      const result = await addVisitPhoto({
        visitId,
        engagementId,
        sectionId,
        storagePath: path,
        caption: null,
        position: position++,
      });

      if (result.error) {
        await supabase.storage.from("ficha-fotos").remove([path]);
        setError(result.error);
      }
    }

    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted">
          Fotos desta seção {photos.length > 0 ? `(${photos.length})` : ""}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn-ghost px-3 py-2 text-xs"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {busy ? "Enviando…" : "Anexar foto"}
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      {photos.length > 0 ? (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              number={index + 1}
              engagementId={engagementId}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PhotoCard({
  photo,
  number,
  engagementId,
}: {
  photo: PhotoWithUrl;
  number: number;
  engagementId: string;
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [removing, setRemoving] = useState(false);

  return (
    <li className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="relative aspect-4/3 bg-surface-2">
        {photo.url ? (
          <Image
            src={photo.url}
            alt={caption || `Foto ${number}`}
            fill
            unoptimized
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-muted">
            Imagem indisponível
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white">
          {number}
        </span>
      </div>

      <div className="p-2">
        <input
          className="input px-2 py-1.5 text-xs"
          placeholder="Legenda da foto"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          onBlur={() => {
            if (caption !== (photo.caption ?? "")) {
              void updatePhotoCaption(photo.id, engagementId, caption);
            }
          }}
          aria-label={`Legenda da foto ${number}`}
        />
        <button
          type="button"
          disabled={removing}
          onClick={async () => {
            setRemoving(true);
            await deleteVisitPhoto(photo.id, photo.storage_path, engagementId);
            router.refresh();
          }}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-muted transition hover:bg-surface-2 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remover
        </button>
      </div>
    </li>
  );
}
