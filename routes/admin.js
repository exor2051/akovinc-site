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
        if (allowed.includes(ext) && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece JPG, PNG, GIF ve WEBP dosyaları yüklenebilir!'));
        }
    }
});

router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('admin/login', { error: 'Kullanıcı adı ve şifre gereklidir!' });
    }
    try {
        const user = db.find('users', u => u.username === username);
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            return res.redirect('/admin/dashboard');
        }
    } catch (_) { }
    res.render('admin/login', { error: 'Hatalı kullanıcı adı veya şifre!' });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

const publicPaths = ['/login'];
router.use((req, res, next) => {
    if (publicPaths.includes(req.path)) return next();
    auth(req, res, next);
});

router.get('/dashboard', (req, res) => {
    try {
        const siteData = db.first('content') || { title: 'Ako Vinç', description: '', whatsapp: '', phone: '', email: '', address: '', working_hours: '', facebook: '', instagram: '', twitter: '', youtube: '', bg_image: '', primary_color: '#f39c12', secondary_color: '#1a252f' };

        const errorMsg = req.query.err === 'wrong-password' ? 'Mevcut şifrenizi yanlış girdiniz!' : null;
        const successMsg = req.query.msg === 'saved' ? 'Değişiklikler kaydedildi!' : null;

        res.render('admin/dashboard', {
            content: siteData,
            services: db.get('services'),
            testimonials: db.all('testimonials', (a, b) => new Date(b.created_at) - new Date(a.created_at)),
            gallery: db.all('gallery', (a, b) => new Date(b.created_at) - new Date(a.created_at)),
            slides: db.all('hero_slides', (a, b) => a.sort_order - b.sort_order),
            seo: db.find('seo', s => s.page === 'home') || {},
            errorMsg,
            successMsg,
            activeTab: req.query.tab || 'genel'
        });
    } catch {
        res.render('admin/login', { error: 'Veritabanı bağlantı hatası.' });
    }
});

router.post('/update', upload.fields([{ name: 'bgGorsel', maxCount: 1 }, { name: 'logoGorsel', maxCount: 1 }]), (req, res) => {
    try {
        const existing = db.first('content');
        const bgImage = req.files?.bgGorsel?.[0]?.filename || existing?.bg_image || '';

        db.update('content', c => c.id === 1, {
            title: req.body.title || '',
            description: req.body.description || '',
            whatsapp: req.body.whatsapp || '',
            phone: req.body.phone || '',
            email: req.body.email || '',
            address: req.body.address || '',
            working_hours: req.body.working_hours || '',
            facebook: req.body.facebook || '',
            instagram: req.body.instagram || '',
            twitter: req.body.twitter || '',
            youtube: req.body.youtube || '',
            bg_image: bgImage,
            primary_color: req.body.primary_color || '#f39c12',
            secondary_color: req.body.secondary_color || '#1a252f'
        });
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
        const user = db.find('users', u => u.id === req.session.userId);
        if (user && bcrypt.compareSync(current_password, user.password)) {
            db.update('users', u => u.id === req.session.userId, { password: bcrypt.hashSync(new_password, 10) });
            return res.redirect('/admin/dashboard?tab=guvenlik&msg=saved');
        }
    } catch (_) { }
    res.redirect('/admin/dashboard?tab=guvenlik&err=wrong-password');
});

router.post('/add-service', upload.single('serviceGorsel'), (req, res) => {
    if (!req.body.title || !req.body.description) return res.redirect('/admin/dashboard?tab=hizmetler');
    const image = req.file ? req.file.filename : null;
    db.add('services', { title: req.body.title, description: req.body.description, image });
    res.redirect('/admin/dashboard?tab=hizmetler&msg=saved');
});

router.post('/delete-service', (req, res) => {
    const id = parseInt(req.body.id);
    if (!id) return res.redirect('/admin/dashboard?tab=hizmetler');
    db.remove('services', s => s.id === id);
    res.redirect('/admin/dashboard?tab=hizmetler&msg=saved');
});

router.post('/add-testimonial', (req, res) => {
    if (!req.body.name || !req.body.comment) return res.redirect('/admin/dashboard?tab=referanslar');
    db.add('testimonials', { name: req.body.name, company: req.body.company || '', comment: req.body.comment, rating: parseInt(req.body.rating) || 5 });
    res.redirect('/admin/dashboard?tab=referanslar&msg=saved');
});

router.post('/delete-testimonial', (req, res) => {
    const id = parseInt(req.body.id);
    if (!id) return res.redirect('/admin/dashboard?tab=referanslar');
    db.remove('testimonials', t => t.id === id);
    res.redirect('/admin/dashboard?tab=referanslar&msg=saved');
});

router.post('/add-gallery', upload.single('galleryImage'), (req, res) => {
    if (!req.file) return res.redirect('/admin/dashboard?tab=galeri');
    db.add('gallery', { image: req.file.filename, caption: req.body.caption || '' });
    res.redirect('/admin/dashboard?tab=galeri&msg=saved');
});

router.post('/delete-gallery', (req, res) => {
    const id = parseInt(req.body.id);
    if (!id) return res.redirect('/admin/dashboard?tab=galeri');
    db.remove('gallery', g => g.id === id);
    res.redirect('/admin/dashboard?tab=galeri&msg=saved');
});

router.post('/add-slide', upload.single('slideImage'), (req, res) => {
    if (!req.file) return res.redirect('/admin/dashboard?tab=slider');
    db.add('hero_slides', { image: req.file.filename, title: req.body.title || '', subtitle: req.body.subtitle || '', sort_order: parseInt(req.body.sort_order) || 0 });
    res.redirect('/admin/dashboard?tab=slider&msg=saved');
});

router.post('/delete-slide', (req, res) => {
    const id = parseInt(req.body.id);
    if (!id) return res.redirect('/admin/dashboard?tab=slider');
    db.remove('hero_slides', s => s.id === id);
    res.redirect('/admin/dashboard?tab=slider&msg=saved');
});

router.post('/update-seo', (req, res) => {
    try {
        const existing = db.find('seo', s => s.page === 'home');
        if (existing) {
            db.update('seo', s => s.page === 'home', { meta_title: req.body.meta_title, meta_description: req.body.meta_description, meta_keywords: req.body.meta_keywords });
        } else {
            db.add('seo', { page: 'home', meta_title: req.body.meta_title, meta_description: req.body.meta_description, meta_keywords: req.body.meta_keywords });
        }
        res.redirect('/admin/dashboard?tab=seo&msg=saved');
    } catch {
        res.redirect('/admin/dashboard?tab=seo');
    }
});

module.exports = router;
