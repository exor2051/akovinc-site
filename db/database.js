const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'akovinc.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT);
    CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY, title, description, whatsapp, phone, email, address, working_hours, facebook, instagram, twitter, youtube, bg_image, primary_color, secondary_color);
    CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, title, description, image);
    CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY, image, caption, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, name, company, comment, rating INTEGER DEFAULT 5, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS hero_slides (id INTEGER PRIMARY KEY AUTOINCREMENT, image, title, subtitle, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS seo (id INTEGER PRIMARY KEY, page UNIQUE, meta_title, meta_description, meta_keywords);
`);

module.exports = db;
