const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

export const CONFIG = {
    PORT,
    API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${PORT}`,
    UI_BASE_URL: process.env.UI_BASE_URL || `http://claude-code:${PORT}`,
    COLLECTIONS_DIRECTORY: process.env.COLLECTIONS_DIRECTORY || '/workspace/projects/image-vault/private',
    THUMBNAIL_WIDTH: 400,
    MODE: 'DEV'
} as const;