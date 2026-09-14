"use client";

import { useFormStatus } from "react-dom";

import { Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  className = "btn-primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
