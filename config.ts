const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

type Config = {
    PORT: number;
    API_BASE_URL: string;
    UI_BASE_URL: string;
    COLLECTIONS_DIRECTORY: string;
    THUMBNAIL_WIDTH: number;
    MODE: string;
    LOGGING_ENABLED: boolean;
}

export const CONFIG = {
    PORT,
    API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${PORT}`,
    UI_BASE_URL: process.env.UI_BASE_URL || `http://localhost:${PORT}`,
    COLLECTIONS_DIRECTORY: process.env.COLLECTIONS_DIRECTORY || './private',
    THUMBNAIL_WIDTH: 400,
    MODE: 'DEV',
    LOGGING_ENABLED: false,
} as const;

class Logger {
    static log(message: string): void {
        if (CONFIG.LOGGING_ENABLED) {
            console.log(message);
        }
    }
}

declare global {
    const LOGGER: typeof Logger;
    const CONFIG: Config;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).LOGGER = Logger;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).CONFIG = CONFIG;
