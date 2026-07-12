const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'akovinc.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 SQLite veritabanına bağlanıldı.');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);
    CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY, title TEXT, description TEXT, whatsapp TEXT, phone TEXT, email TEXT, address TEXT, working_hours TEXT, facebook TEXT, instagram TEXT, twitter TEXT, youtube TEXT, bg_image TEXT, primary_color TEXT, secondary_color TEXT);
    CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, image TEXT);
    CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, image TEXT, caption TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, company TEXT, comment TEXT, rating INTEGER DEFAULT 5, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS hero_slides (id INTEGER PRIMARY KEY AUTOINCREMENT, image TEXT, title TEXT, subtitle TEXT, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS seo (id INTEGER PRIMARY KEY AUTOINCREMENT, page TEXT UNIQUE, meta_title TEXT, meta_description TEXT, meta_keywords TEXT);
`);

module.exports = db;
