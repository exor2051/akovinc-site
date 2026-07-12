const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
    db.get('SELECT * FROM content WHERE id = 1', (err, contentRow) => {
        if (err) return res.status(500).send('Sunucu hatası');
        db.all('SELECT * FROM services', (err, servicesRows) => {
            if (err) return res.status(500).send('Sunucu hatası');
            db.all('SELECT * FROM testimonials ORDER BY created_at DESC', (err, testimonialRows) => {
                if (err) return res.status(500).send('Sunucu hatası');
                db.all('SELECT * FROM gallery ORDER BY created_at DESC', (err, galleryRows) => {
                    if (err) return res.status(500).send('Sunucu hatası');
                    db.all('SELECT * FROM hero_slides ORDER BY sort_order ASC', (err, slideRows) => {
                        if (err) return res.status(500).send('Sunucu hatası');
                        db.get('SELECT * FROM seo WHERE page = ?', ['home'], (err, seoRow) => {
                            if (err) return res.status(500).send('Sunucu hatası');
                            const siteData = contentRow || { title: 'Ako Vinç', description: '', whatsapp: '', phone: '', email: '', address: '', working_hours: '', facebook: '', instagram: '', twitter: '', youtube: '', bg_image: '', primary_color: '#f39c12', secondary_color: '#1a252f' };
                            res.render('index', { content: siteData, services: servicesRows || [], testimonials: testimonialRows || [], gallery: galleryRows || [], slides: slideRows || [], seo: seoRow || {} });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
