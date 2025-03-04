/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_SERVER_PORT: string;
  readonly VITE_CLIENT_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
