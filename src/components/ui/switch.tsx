"use client";

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  srOnlyLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Deixe vazio e informe `srOnlyLabel` quando o rótulo já estiver ao lado. */
  label: string;
  description?: string;
  disabled?: boolean;
  srOnlyLabel?: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}
    >
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={srOnlyLabel}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="h-6 w-11 rounded-full bg-line-strong transition peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
        />
        <span
          aria-hidden
          className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
        />
      </span>

      {label || description ? (
        <span className="min-w-0">
          {label ? (
            <span className="block text-sm font-semibold leading-tight">{label}</span>
          ) : null}
          {description ? (
            <span className="mt-0.5 block text-xs text-muted">{description}</span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}
