const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'akovinc.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Veritabanı hatası:', err.message);
    else console.log('📦 SQLite veritabanına bağlanıldı.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, username TEXT, password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY,
        title TEXT,
        description TEXT,
        whatsapp TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        working_hours TEXT,
        facebook TEXT,
        instagram TEXT,
        twitter TEXT,
        youtube TEXT,
        bg_image TEXT,
        primary_color TEXT,
        secondary_color TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        image TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image TEXT,
        caption TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        company TEXT,
        comment TEXT,
        rating INTEGER DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS hero_slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image TEXT,
        title TEXT,
        subtitle TEXT,
        sort_order INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS seo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page TEXT UNIQUE,
        meta_title TEXT,
        meta_description TEXT,
        meta_keywords TEXT
    )`);
});

module.exports = db;
