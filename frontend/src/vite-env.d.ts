/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_ENTITLEMENTS_PATH: string;
  readonly VITE_API_CONVERSATIONS_PATH: string;
  readonly VITE_API_CONVERSATION_PATH: string;
  readonly VITE_API_MESSAGES_PATH: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_DEV_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
