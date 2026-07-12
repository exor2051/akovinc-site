const db = require('./database');
const bcrypt = require('bcryptjs');

db.serialize(async () => {
    const hash = await bcrypt.hash('123456', 10);
    
    db.run(`INSERT OR IGNORE INTO users (id, username, password) VALUES (1, 'admin', ?)`, [hash]);

    db.run(`INSERT OR IGNORE INTO content (id, title, description, whatsapp, phone, email, address, working_hours, facebook, instagram, twitter, youtube, bg_image, primary_color, secondary_color) VALUES (1,
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
    )`);

    db.run(`INSERT OR IGNORE INTO services (id, title, description, image) VALUES (1, 'Sepetli Vinç', 'Yüksek katlı cephe işlemleri ve montaj için ideal çözüm.', '')`);
    db.run(`INSERT OR IGNORE INTO services (id, title, description, image) VALUES (2, 'Mobil Vinç', 'Her türlü arazi koşulunda çalışabilen mobil vinç hizmeti.', '')`);
    db.run(`INSERT OR IGNORE INTO services (id, title, description, image) VALUES (3, 'Kule Vinç', 'İnşaat projeleriniz için uzun vadeli kule vinç kiralama.', '')`);

    db.run(`INSERT OR IGNORE INTO seo (page, meta_title, meta_description, meta_keywords) VALUES ('home', 'Ako Vinç - Profesyonel Vinç Hizmetleri', 'Ako Vinç ile ağır yüklerinizi güvenle taşıyın. 7/24 profesyonel vinç kiralama hizmeti.', 'vinç, vinç kiralama, sepetli vinç, mobil vinç, İstanbul vinç')`);


    console.log('✅ Yeni veritabanı kuruldu!');
});
