/// <reference types="vite/client" />

type ViteEnvString = string | undefined;

declare interface ImportMetaEnv {
  readonly VITE_MODEL: ViteEnvString;
  readonly VITE_OPENAI_API_KEY: ViteEnvString;
  readonly VITE_OPENAI_BASE_URL: ViteEnvString;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
