const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const CONFIG = {
    PORT,
    API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${PORT}`,
    UI_BASE_URL: process.env.UI_BASE_URL || `http://localhost:${PORT}`,
    COLLECTIONS_DIRECTORY: process.env.COLLECTIONS_DIRECTORY || './private',
    THUMBNAIL_WIDTH: 400,
    MODE: 'DEV',
    LOGGING_ENABLED: false,
};
class Logger {
    static log(message) {
        if (CONFIG.LOGGING_ENABLED) {
            console.log(message);
        }
    }
}
global.LOGGER = Logger;
global.CONFIG = CONFIG;
