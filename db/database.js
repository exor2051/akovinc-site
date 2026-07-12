const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Render'da /var/data kalıcıdır, deploy'da silinmez
const dataDir = process.env.NODE_ENV === 'production' ? '/var/data' : __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'akovinc.db');
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

// Seed - ilk kullanıcıyı ekle
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (userCount.c === 0) {
    const bcrypt = require('bcryptjs');
    db.prepare('INSERT INTO users (id, username, password) VALUES (1, ?, ?)').run('admin', bcrypt.hashSync('123456', 10));
    db.prepare('INSERT INTO content (id, title, description, whatsapp, phone, primary_color, secondary_color) VALUES (1, ?, ?, ?, ?, ?, ?)').run('Ako Vinç Hizmetleri', 'Ağır yüklerinizi güvenle taşıyor, projelerinize güç katıyoruz.', '905551234567', '0212 555 12 34', '#f39c12', '#1a252f');
    db.prepare('INSERT INTO seo (page, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?)').run('home', 'Ako Vinç - Profesyonel Vinç Hizmetleri', 'Ako Vinç ile ağır yüklerinizi güvenle taşıyın.', 'vinç, vinç kiralama');
    console.log('✅ Seed verileri eklendi');
}

module.exports = db;
