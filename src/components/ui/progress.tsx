export function Progress({
  value,
  max,
  barClassName = "bg-primary",
}: {
  value: number;
  max: number;
  barClassName?: string;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${barClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
