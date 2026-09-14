"use client";

import { Plus, X } from "lucide-react";

import type { Field, TableColumn } from "@/lib/visit-form";

export type FieldValue = string | string[] | Record<string, string>[] | undefined;

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  const id = `campo-${field.key}`;

  if (field.kind === "checks") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset>
        <legend className="label">{field.label}</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {(field.options ?? []).map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                  checked
                    ? "border-primary bg-primary-soft/50"
                    : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option),
                    )
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.kind === "radio") {
    return (
      <fieldset>
        <legend className="label">{field.label}</legend>
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const checked = value === option;
            return (
              <label
                key={option}
                className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  checked
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-line bg-surface text-muted hover:text-fg"
                }`}
              >
                <input
                  type="radio"
                  name={id}
                  checked={checked}
                  onChange={() => onChange(option)}
                  className="sr-only"
                />
                {option}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.kind === "table") {
    return (
      <TableField
        field={field}
        rows={Array.isArray(value) ? (value as Record<string, string>[]) : []}
        onChange={onChange}
      />
    );
  }

  const text = typeof value === "string" ? value : "";

  return (
    <div>
      <label className="label" htmlFor={id}>
        {field.label}
        {field.unit ? <span className="ml-1 text-muted">({field.unit})</span> : null}
      </label>

      {field.kind === "textarea" ? (
        <textarea
          id={id}
          rows={field.rows ?? 3}
          className="input"
          placeholder={field.placeholder}
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.kind === "select" ? (
        <select
          id={id}
          className="input"
          value={text}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.kind === "date" ? "date" : field.kind === "time" ? "time" : "text"}
          inputMode={field.kind === "number" ? "decimal" : undefined}
          className="input"
          placeholder={field.placeholder}
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {field.hint ? <p className="mt-1 text-xs text-muted">{field.hint}</p> : null}
    </div>
  );
}

/**
 * Tabela de itens (inventários, medições, oportunidades).
 * No celular cada linha vira um cartão; no desktop vira tabela de verdade.
 */
function TableField({
  field,
  rows,
  onChange,
}: {
  field: Field;
  rows: Record<string, string>[];
  onChange: (value: Record<string, string>[]) => void;
}) {
  const columns = field.columns ?? [];
  const template = columns.map((column) => `${column.grow ?? 1}fr`).join(" ");

  function update(index: number, key: string, next: string) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: next } : row)));
  }

  function addRow() {
    onChange([...rows, Object.fromEntries(columns.map((column) => [column.key, ""]))]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div>
      <p className="label">{field.label}</p>

      {rows.length > 0 ? (
        <>
          {/* Cabeçalho só no desktop */}
          <div
            className="mb-1 hidden gap-2 px-1 sm:grid"
            style={{ gridTemplateColumns: `${template} 32px` }}
          >
            {columns.map((column) => (
              <span key={column.key} className="text-[11px] font-semibold text-muted">
                {column.label}
              </span>
            ))}
            <span />
          </div>

          <ul className="space-y-2 sm:space-y-1">
            {rows.map((row, index) => (
              <li
                key={index}
                className="grid gap-2 rounded-xl border border-line bg-surface-2 p-3 sm:items-center sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0"
                style={{ gridTemplateColumns: undefined }}
              >
                <div
                  className="grid gap-2 sm:gap-2"
                  style={{ gridTemplateColumns: `${template} 32px` }}
                  data-row
                >
                  {columns.map((column) => (
                    <div key={column.key} className="min-w-0">
                      <span className="mb-1 block text-[11px] font-medium text-muted sm:hidden">
                        {column.label}
                      </span>
                      <CellInput
                        column={column}
                        value={row[column.key] ?? ""}
                        onChange={(next) => update(index, column.key, next)}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label={`Remover linha ${index + 1}`}
                    className="mt-5 h-9 w-8 shrink-0 rounded-lg text-muted transition hover:bg-surface-2 hover:text-rose-600 sm:mt-0"
                  >
                    <X className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-3 py-5 text-center text-sm text-muted">
          Nenhuma linha ainda.
        </p>
      )}

      <button type="button" onClick={addRow} className="btn-ghost mt-2 w-full text-sm sm:w-auto">
        <Plus className="h-4 w-4" />
        Adicionar linha
      </button>
    </div>
  );
}

function CellInput({
  column,
  value,
  onChange,
}: {
  column: TableColumn;
  value: string;
  onChange: (value: string) => void;
}) {
  if (column.kind === "select") {
    return (
      <select
        className="input px-2 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={column.label}
      >
        <option value="">—</option>
        {(column.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className="input px-2 py-2 text-sm"
      inputMode={column.kind === "number" ? "decimal" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={column.label}
    />
  );
}
