/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BUILD_TIME?: string
    readonly VITE_BUILD_ENV?: string
    readonly VITE_LAST_COMMIT?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

