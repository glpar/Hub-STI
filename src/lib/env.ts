/** Diz se as chaves do Supabase já foram configuradas no .env.local */
export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith("http") && !url.includes("xxxxx"));
}
