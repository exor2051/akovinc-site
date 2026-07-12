const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
    try {
        const contentRow = db.prepare('SELECT * FROM content WHERE id = 1').get();
        const servicesRows = db.prepare('SELECT * FROM services').all();
        const testimonialRows = db.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
        const galleryRows = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
        const slideRows = db.prepare('SELECT * FROM hero_slides ORDER BY sort_order ASC').all();
        const seoRow = db.prepare('SELECT * FROM seo WHERE page = ?').get('home');

        res.render('index', {
            content: contentRow || { title: 'Ako Vinç', description: '', whatsapp: '', phone: '', email: '', address: '', working_hours: '', facebook: '', instagram: '', twitter: '', youtube: '', bg_image: '', primary_color: '#f39c12', secondary_color: '#1a252f' },
            services: servicesRows || [],
            testimonials: testimonialRows || [],
            gallery: galleryRows || [],
            slides: slideRows || [],
            seo: seoRow || {}
        });
    } catch {
        res.status(500).send('Sunucu hatası');
    }
});

module.exports = router;
