/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_BASE?: string;        // optional API base URL
  readonly VITE_FEATURE_FLAG?: boolean;   // optional feature flag
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
