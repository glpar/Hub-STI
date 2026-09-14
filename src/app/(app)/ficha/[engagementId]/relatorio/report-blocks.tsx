import Image from "next/image";

import type { Field, Section } from "@/lib/visit-form";

import type { PhotoWithUrl } from "../photo-strip";

export type Answers = Record<string, Record<string, unknown>>;

export function hasValue(value: unknown) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) {
    return value.some((item) =>
      typeof item === "string"
        ? item.trim() !== ""
        : Object.values(item as Record<string, unknown>).some(
            (cell) => String(cell ?? "").trim() !== "",
          ),
    );
  }
  return false;
}

export function sectionFilled(section: Section, answers: Answers) {
  return section.groups.some((group) =>
    group.fields.some((field) => hasValue(answers[section.id]?.[field.key])),
  );
}

function FieldValueView({ field, value }: { field: Field; value: unknown }) {
  if (field.kind === "checks" && Array.isArray(value)) {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {(value as string[]).map((item) => (
          <li key={item} className="pill bg-surface-2 text-fg">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (field.kind === "table" && Array.isArray(value)) {
    const rows = (value as Record<string, string>[]).filter((row) =>
      Object.values(row).some((cell) => String(cell ?? "").trim() !== ""),
    );
    if (rows.length === 0) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              {(field.columns ?? []).map((column) => (
                <th key={column.key} className="py-1.5 pr-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-line/60">
                {(field.columns ?? []).map((column) => (
                  <td key={column.key} className="py-1.5 pr-3">
                    {String(row[column.key] ?? "").trim() || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const text = String(value ?? "");
  if (field.kind === "textarea") {
    return <p className="whitespace-pre-line text-sm leading-relaxed">{text}</p>;
  }

  return (
    <p className="text-sm">
      {text}
      {field.unit ? <span className="text-muted"> {field.unit}</span> : null}
    </p>
  );
}

export function ReportSection({
  section,
  answers,
  photos,
  index,
}: {
  section: Section;
  answers: Answers;
  photos: PhotoWithUrl[];
  index: number;
}) {
  const filled = sectionFilled(section, answers);
  if (!filled && photos.length === 0) return null;

  return (
    <section className="break-inside-avoid">
      <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
        {index}. {section.title}
      </h2>

      <div className="space-y-4">
        {section.groups.map((group, groupIndex) => {
          const visible = group.fields.filter((field) =>
            hasValue(answers[section.id]?.[field.key]),
          );
          if (visible.length === 0) return null;

          return (
            <div key={group.title ?? groupIndex}>
              {group.title ? <p className="section-title mb-2">{group.title}</p> : null}
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {visible.map((field) => (
                  <div
                    key={field.key}
                    className={
                      field.wide || field.kind === "table" || field.kind === "checks"
                        ? "sm:col-span-2"
                        : undefined
                    }
                  >
                    <dt className="text-xs font-medium text-muted">{field.label}</dt>
                    <dd className="mt-0.5">
                      <FieldValueView field={field} value={answers[section.id]?.[field.key]} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}

        <PhotoGallery photos={photos} />
      </div>
    </section>
  );
}

export function PhotoGallery({ photos }: { photos: PhotoWithUrl[] }) {
  if (photos.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <li key={photo.id} className="break-inside-avoid">
          <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-line bg-surface-2">
            {photo.url ? (
              <Image
                src={photo.url}
                alt={photo.caption || "Evidência fotográfica"}
                fill
                unoptimized
                sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            ) : null}
          </div>
          {photo.caption ? (
            <p className="mt-1 text-xs text-muted">{photo.caption}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
