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

function renderError(res, msg) {
    res.render('admin/login', { error: msg });
}

router.get('/login', (req, res) => res.render('admin/login', { error: null }));
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.render('admin/login', { error: 'Kullanıcı adı ve şifre gereklidir!' });

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            return res.redirect('/admin/dashboard');
        }
        res.render('admin/login', { error: 'Hatalı kullanıcı adı veya şifre!' });
    } catch {
        renderError(res, 'Bir hata oluştu.');
    }
});

router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

const publicPaths = ['/login'];
router.use((req, res, next) => {
    if (publicPaths.includes(req.path)) return next();
    auth(req, res, next);
});

router.get('/dashboard', (req, res) => {
    try {
        const contentRow = db.prepare('SELECT * FROM content WHERE id = 1').get();
        const servicesRows = db.prepare('SELECT * FROM services').all();
        const testimonialRows = db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
        const galleryRows = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
        const slideRows = db.prepare('SELECT * FROM hero_slides ORDER BY sort_order ASC').all();
        const seoRow = db.prepare('SELECT * FROM seo WHERE page = ?').get('home');

        const errorMsg = req.query.err === 'wrong-password' ? 'Mevcut şifrenizi yanlış girdiniz!' : null;
        const successMsg = req.query.msg === 'saved' ? 'Değişiklikler kaydedildi!' : null;

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
    } catch {
        renderError(res, 'Veritabanı hatası.');
    }
});

router.post('/update', upload.fields([{ name: 'bgGorsel', maxCount: 1 }, { name: 'logoGorsel', maxCount: 1 }]), (req, res) => {
    const { title, description, whatsapp, phone, email, address, working_hours, facebook, instagram, twitter, youtube, primary_color, secondary_color } = req.body;
    try {
        const row = db.prepare('SELECT bg_image FROM content WHERE id = 1').get();
        const bgImage = req.files?.bgGorsel?.[0]?.filename || row?.bg_image || '';
        db.prepare(`UPDATE content SET title=?, description=?, whatsapp=?, phone=?, email=?, address=?, working_hours=?, facebook=?, instagram=?, twitter=?, youtube=?, bg_image=?, primary_color=?, secondary_color=? WHERE id=1`).run(
            title, description, whatsapp, phone, email, address, working_hours, facebook, instagram, twitter, youtube, bgImage, primary_color, secondary_color
        );
        res.redirect('/admin/dashboard?tab=genel&msg=saved');
    } catch {
        res.redirect('/admin/dashboard?tab=genel');
    }
});

router.post('/change-password', (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 6) {
        return res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
    }
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
        if (user && bcrypt.compareSync(current_password, user.password)) {
            const hash = bcrypt.hashSync(new_password, 10);
            db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.session.userId);
            res.redirect('/admin/dashboard?tab=guvenlik&msg=saved');
        } else {
            res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
        }
    } catch {
        res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
    }
});

router.post('/add-service', upload.single('serviceGorsel'), (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) return res.redirect('/admin/dashboard?tab=hizmetler');
    const imageName = req.file ? req.file.filename : null;
    db.prepare('INSERT INTO services (title, description, image) VALUES (?, ?, ?)').run(title, description, imageName);
    res.redirect('/admin/dashboard?tab=hizmetler&msg=saved');
});

router.post('/delete-service', (req, res) => {
    if (!req.body.id) return res.redirect('/admin/dashboard?tab=hizmetler');
    db.prepare('DELETE FROM services WHERE id = ?').run(req.body.id);
    res.redirect('/admin/dashboard?tab=hizmetler&msg=saved');
});

router.post('/add-testimonial', (req, res) => {
    const { name, company, comment, rating } = req.body;
    if (!name || !comment) return res.redirect('/admin/dashboard?tab=referanslar');
    db.prepare('INSERT INTO testimonials (name, company, comment, rating) VALUES (?, ?, ?, ?)').run(name, company || '', comment, rating || 5);
    res.redirect('/admin/dashboard?tab=referanslar&msg=saved');
});

router.post('/delete-testimonial', (req, res) => {
    if (!req.body.id) return res.redirect('/admin/dashboard?tab=referanslar');
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.body.id);
    res.redirect('/admin/dashboard?tab=referanslar&msg=saved');
});

router.post('/add-gallery', upload.single('galleryImage'), (req, res) => {
    if (!req.file) return res.redirect('/admin/dashboard?tab=galeri');
    db.prepare('INSERT INTO gallery (image, caption) VALUES (?, ?)').run(req.file.filename, req.body.caption || '');
    res.redirect('/admin/dashboard?tab=galeri&msg=saved');
});

router.post('/delete-gallery', (req, res) => {
    if (!req.body.id) return res.redirect('/admin/dashboard?tab=galeri');
    db.prepare('DELETE FROM gallery WHERE id = ?').run(req.body.id);
    res.redirect('/admin/dashboard?tab=galeri&msg=saved');
});

router.post('/add-slide', upload.single('slideImage'), (req, res) => {
    if (!req.file) return res.redirect('/admin/dashboard?tab=slider');
    const { title, subtitle, sort_order } = req.body;
    db.prepare('INSERT INTO hero_slides (image, title, subtitle, sort_order) VALUES (?, ?, ?, ?)').run(req.file.filename, title || '', subtitle || '', sort_order || 0);
    res.redirect('/admin/dashboard?tab=slider&msg=saved');
});

router.post('/delete-slide', (req, res) => {
    if (!req.body.id) return res.redirect('/admin/dashboard?tab=slider');
    db.prepare('DELETE FROM hero_slides WHERE id = ?').run(req.body.id);
    res.redirect('/admin/dashboard?tab=slider&msg=saved');
});

router.post('/update-seo', (req, res) => {
    const { meta_title, meta_description, meta_keywords } = req.body;
    try {
        const row = db.prepare('SELECT id FROM seo WHERE page = ?').get('home');
        if (row) {
            db.prepare('UPDATE seo SET meta_title=?, meta_description=?, meta_keywords=? WHERE page=?').run(meta_title, meta_description, meta_keywords, 'home');
        } else {
            db.prepare('INSERT INTO seo (meta_title, meta_description, meta_keywords, page) VALUES (?, ?, ?, ?)').run(meta_title, meta_description, meta_keywords, 'home');
        }
        res.redirect('/admin/dashboard?tab=seo&msg=saved');
    } catch {
        res.redirect('/admin/dashboard?tab=seo');
    }
});

module.exports = router;
