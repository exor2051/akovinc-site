const db = require('./database');
const bcrypt = require('bcryptjs');

const hash = bcrypt.hashSync('123456', 10);

const userExists = db.prepare('SELECT id FROM users WHERE id = 1').get();
if (!userExists) {
    db.prepare('INSERT INTO users (id, username, password) VALUES (1, ?, ?)').run('admin', hash);
}

const contentExists = db.prepare('SELECT id FROM content WHERE id = 1').get();
if (!contentExists) {
    db.prepare(`INSERT INTO content (id, title, description, whatsapp, phone, email, address, working_hours, facebook, instagram, twitter, youtube, bg_image, primary_color, secondary_color) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Ako Vinç Hizmetleri',
        'Ağır yüklerinizi güvenle taşıyor, projelerinize güç katıyoruz. 7/24 profesyonel hizmet.',
        '905551234567',
        '0212 555 12 34',
        'info@akovinc.com',
        'İstanbul, Türkiye',
        'Pazartesi - Cumartesi: 08:00 - 19:00',
        'https://facebook.com/akovinc',
        'https://instagram.com/akovinc',
        '',
        '',
        '',
        '#f39c12',
        '#1a252f'
    );
}

const svcCount = db.prepare('SELECT COUNT(*) as c FROM services').get();
if (svcCount.c === 0) {
    const insert = db.prepare('INSERT INTO services (title, description, image) VALUES (?, ?, ?)');
    insert.run('Sepetli Vinç', 'Yüksek katlı cephe işlemleri ve montaj için ideal çözüm.', '');
    insert.run('Mobil Vinç', 'Her türlü arazi koşulunda çalışabilen mobil vinç hizmeti.', '');
    insert.run('Kule Vinç', 'İnşaat projeleriniz için uzun vadeli kule vinç kiralama.', '');
}

const seoExists = db.prepare('SELECT id FROM seo WHERE page = ?').get('home');
if (!seoExists) {
    db.prepare('INSERT INTO seo (page, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?)').run(
        'home',
        'Ako Vinç - Profesyonel Vinç Hizmetleri',
        'Ako Vinç ile ağır yüklerinizi güvenle taşıyın. 7/24 profesyonel vinç kiralama hizmeti.',
        'vinç, vinç kiralama, sepetli vinç, mobil vinç, İstanbul vinç'
    );
}

console.log('✅ Veritabanı kuruldu!');
