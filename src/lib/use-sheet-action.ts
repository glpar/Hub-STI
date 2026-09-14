"use client";

import { useState } from "react";

type Result = { error?: string; ok?: boolean; id?: string };
type ServerAction = (prev: Result, formData: FormData) => Promise<Result>;

/**
 * Liga um formulário de Sheet a uma server action: mostra o erro quando falha e
 * chama `onSuccess` (normalmente fechar o modal) quando dá certo — sem precisar
 * de useEffect observando o estado.
 */
export function useSheetAction(action: ServerAction, onSuccess: (result: Result) => void) {
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    const result = await action({}, formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError(null);
    onSuccess(result ?? {});
  }

  return { submit, error };
}
