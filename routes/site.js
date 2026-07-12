const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
    try {
        const contentRow = db.first('content');
        const servicesRows = db.get('services');
        const testimonialRows = db.all('testimonials', (a, b) => new Date(b.created_at) - new Date(a.created_at));
        const galleryRows = db.all('gallery', (a, b) => new Date(b.created_at) - new Date(a.created_at));
        const slideRows = db.all('hero_slides', (a, b) => a.sort_order - b.sort_order);
        const seoRow = db.find('seo', s => s.page === 'home') || {};

        res.render('index', {
            content: contentRow || { title: 'Ako Vinç Hizmetleri', description: '', whatsapp: '', phone: '', email: '', address: '', working_hours: '', facebook: '', instagram: '', twitter: '', youtube: '', bg_image: '', primary_color: '#f39c12', secondary_color: '#1a252f' },
            services: servicesRows || [],
            testimonials: testimonialRows || [],
            gallery: galleryRows || [],
            slides: slideRows || [],
            seo: seoRow
        });
    } catch {
        res.status(500).send('Sunucu hatası');
    }
});

// Sitemap XML
router.get('/sitemap.xml', (req, res) => {
    const domain = 'https://www.akovinc.com.tr';
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
</urlset>`);
});

// robots.txt
router.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Sitemap: https://www.akovinc.com.tr/sitemap.xml`);
});

module.exports = router;
