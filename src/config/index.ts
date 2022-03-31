import 'dotenv/config';

export default {
    PORT: process.env.PORT || '',
    DB_PATH: process.env.DB_PATH || '',
    MAILTO: process.env.MAILTO || '',
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
    LOTUSD_ZMQ_URL: process.env.LOTUSD_ZMQ_URL || '',
    DEBUG: process.env.DEBUG === 'true' ? true : false,
    LOGGING_DIR: process.env.LOGGING_DIR || "./logs",
    MAX_SUBS: 5,
    SESSION_SECRET: process.env.SESSION_SECRET || '',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
    DEV_EMAIL: process.env.DEV_EMAIL || '',
    DEV_PASSWORD: process.env.DEV_PASSWORD || '',
    SITE_TITLE: 'Lotus Push Notification Server'
}