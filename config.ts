export const CONFIG = {
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    UI_BASE_URL: process.env.UI_BASE_URL || 'http://claude-code:3000',
    COLLECTIONS_DIRECTORY: process.env.COLLECTIONS_DIRECTORY || '/workspace/projects/image-vault/private',
} as const;