const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../db/database');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, crypto.randomUUID() + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext) && file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Sadece JPG, PNG, GIF ve WEBP dosyaları yüklenebilir!'));
    }
});

// Giriş
router.get('/login', (req, res) => res.render('admin/login', { error: null }));
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.render('admin/login', { error: 'Kullanıcı adı ve şifre gereklidir!' });

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.render('admin/login', { error: 'Bir hata oluştu.' });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.ip = req.ip;
            req.session.userAgent = req.get('User-Agent');
            return res.redirect('/admin/dashboard');
        }
        res.render('admin/login', { error: 'Hatalı kullanıcı adı veya şifre!' });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

// Auth middleware
const publicPaths = ['/login'];
router.use((req, res, next) => {
    if (publicPaths.includes(req.path)) return next();
    auth(req, res, next);
});

// Dashboard
router.get('/dashboard', (req, res) => {
    const errorMsg = req.query.err === 'wrong-password' ? 'Mevcut şifrenizi yanlış girdiniz!' : null;
    const successMsg = req.query.msg === 'saved' ? 'Değişiklikler kaydedildi!' : null;

    db.get('SELECT * FROM content WHERE id = 1', (err, contentRow) => {
        if (err) return res.status(500).render('admin/login', { error: 'Veritabanı hatası.' });
        db.all('SELECT * FROM services', (err, servicesRows) => {
            if (err) return res.status(500).render('admin/login', { error: 'Veritabanı hatası.' });
            db.all('SELECT * FROM testimonials ORDER BY created_at DESC', (err, testimonialRows) => {
                if (err) return res.status(500).render('admin/login', { error: 'Veritabanı hatası.' });
                db.all('SELECT * FROM gallery ORDER BY created_at DESC', (err, galleryRows) => {
                    if (err) return res.status(500).render('admin/login', { error: 'Veritabanı hatası.' });
                    db.all('SELECT * FROM hero_slides ORDER BY sort_order ASC', (err, slideRows) => {
                        if (err) return res.status(500).render('admin/login', { error: 'Veritabanı hatası.' });
                        db.get('SELECT * FROM seo WHERE page = ?', ['home'], (err, seoRow) => {
                            if (err) return res.status(500).render('admin/login', { error: 'Veritabanı hatası.' });
                            res.render('admin/dashboard', {
                                content: contentRow,
                                services: servicesRows || [],
                                testimonials: testimonialRows || [],
                                gallery: galleryRows || [],
                                slides: slideRows || [],
                                seo: seoRow || {},
                                errorMsg,
                                successMsg,
                                activeTab: req.query.tab || 'genel'
                            });
                        });
                    });
                });
            });
        });
    });
});

// Site Bilgileri
router.post('/update', upload.fields([
    { name: 'bgGorsel', maxCount: 1 },
    { name: 'logoGorsel', maxCount: 1 }
]), (req, res) => {
    const { title, description, whatsapp, phone, email, address, working_hours, facebook, instagram, twitter, youtube, primary_color, secondary_color } = req.body;

    db.get('SELECT * FROM content WHERE id = 1', (err, row) => {
        if (err) return res.redirect('/admin/dashboard?tab=genel');
        const bgImage = req.files?.bgGorsel?.[0]?.filename || row?.bg_image || '';

        db.run(`UPDATE content SET title=?, description=?, whatsapp=?, phone=?, email=?, address=?, working_hours=?, facebook=?, instagram=?, twitter=?, youtube=?, bg_image=?, primary_color=?, secondary_color=? WHERE id=1`,
            [title, description, whatsapp, phone, email, address, working_hours, facebook, instagram, twitter, youtube, bgImage, primary_color, secondary_color],
            function (err) {
                if (err) return res.redirect('/admin/dashboard?tab=genel');
                res.redirect('/admin/dashboard?tab=genel&msg=saved');
            }
        );
    });
});

// Şifre Değiştir
router.post('/change-password', (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 6) {
        return res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
    }

    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], async (err, user) => {
        if (err || !user) return res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
        if (await bcrypt.compare(current_password, user.password)) {
            const hashedNewPassword = await bcrypt.hash(new_password, 10);
            db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.session.userId], function (err) {
                if (err) return res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
                res.redirect('/admin/dashboard?tab=guvenlik&msg=saved');
            });
        } else {
            res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
        }
    });
});

// Hizmetler
router.post('/add-service', upload.single('serviceGorsel'), (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) return res.redirect('/admin/dashboard?tab=hizmetler');
    const imageName = req.file ? req.file.filename : null;
    db.run('INSERT INTO services (title, description, image) VALUES (?, ?, ?)',
        [title, description, imageName],
        function (err) {
            if (err) return res.redirect('/admin/dashboard?tab=hizmetler');
            res.redirect('/admin/dashboard?tab=hizmetler&msg=saved');
        }
    );
});

router.post('/delete-service', (req, res) => {
    const { id } = req.body;
    if (!id) return res.redirect('/admin/dashboard?tab=hizmetler');
    db.run('DELETE FROM services WHERE id = ?', [id], function (err) {
        if (err) return res.redirect('/admin/dashboard?tab=hizmetler');
        res.redirect('/admin/dashboard?tab=hizmetler&msg=saved');
    });
});

// Referanslar
router.post('/add-testimonial', (req, res) => {
    const { name, company, comment, rating } = req.body;
    if (!name || !comment) return res.redirect('/admin/dashboard?tab=referanslar');
    db.run('INSERT INTO testimonials (name, company, comment, rating) VALUES (?, ?, ?, ?)',
        [name, company || '', comment, rating || 5],
        function (err) {
            if (err) return res.redirect('/admin/dashboard?tab=referanslar');
            res.redirect('/admin/dashboard?tab=referanslar&msg=saved');
        }
    );
});

router.post('/delete-testimonial', (req, res) => {
    const { id } = req.body;
    if (!id) return res.redirect('/admin/dashboard?tab=referanslar');
    db.run('DELETE FROM testimonials WHERE id = ?', [id], function (err) {
        if (err) return res.redirect('/admin/dashboard?tab=referanslar');
        res.redirect('/admin/dashboard?tab=referanslar&msg=saved');
    });
});

// Galeri
router.post('/add-gallery', upload.single('galleryImage'), (req, res) => {
    if (!req.file) return res.redirect('/admin/dashboard?tab=galeri');
    db.run('INSERT INTO gallery (image, caption) VALUES (?, ?)',
        [req.file.filename, req.body.caption || ''],
        function (err) {
            if (err) return res.redirect('/admin/dashboard?tab=galeri');
            res.redirect('/admin/dashboard?tab=galeri&msg=saved');
        }
    );
});

router.post('/delete-gallery', (req, res) => {
    const { id } = req.body;
    if (!id) return res.redirect('/admin/dashboard?tab=galeri');
    db.run('DELETE FROM gallery WHERE id = ?', [id], function (err) {
        if (err) return res.redirect('/admin/dashboard?tab=galeri');
        res.redirect('/admin/dashboard?tab=galeri&msg=saved');
    });
});

// Hero Slider
router.post('/add-slide', upload.single('slideImage'), (req, res) => {
    if (!req.file) return res.redirect('/admin/dashboard?tab=slider');
    const { title, subtitle, sort_order } = req.body;
    db.run('INSERT INTO hero_slides (image, title, subtitle, sort_order) VALUES (?, ?, ?, ?)',
        [req.file.filename, title || '', subtitle || '', sort_order || 0],
        function (err) {
            if (err) return res.redirect('/admin/dashboard?tab=slider');
            res.redirect('/admin/dashboard?tab=slider&msg=saved');
        }
    );
});

router.post('/delete-slide', (req, res) => {
    const { id } = req.body;
    if (!id) return res.redirect('/admin/dashboard?tab=slider');
    db.run('DELETE FROM hero_slides WHERE id = ?', [id], function (err) {
        if (err) return res.redirect('/admin/dashboard?tab=slider');
        res.redirect('/admin/dashboard?tab=slider&msg=saved');
    });
});

// SEO
router.post('/update-seo', (req, res) => {
    const { meta_title, meta_description, meta_keywords } = req.body;
    db.get('SELECT id FROM seo WHERE page = ?', ['home'], (err, row) => {
        if (err) return res.redirect('/admin/dashboard?tab=seo');
        const query = row
            ? 'UPDATE seo SET meta_title=?, meta_description=?, meta_keywords=? WHERE page=?'
            : 'INSERT INTO seo (meta_title, meta_description, meta_keywords, page) VALUES (?, ?, ?, ?)';
        const params = row
            ? [meta_title, meta_description, meta_keywords, 'home']
            : [meta_title, meta_description, meta_keywords, 'home'];
        db.run(query, params, function (err) {
            if (err) return res.redirect('/admin/dashboard?tab=seo');
            res.redirect('/admin/dashboard?tab=seo&msg=saved');
        });
    });
});

module.exports = router;
