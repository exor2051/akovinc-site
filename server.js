const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Helmet ile güvenlik başlıkları
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.' }
});

// Şablon motoru ve statik dosyalar
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    dotfiles: 'deny',
    maxAge: isProduction ? '7d' : 0
}));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

// Session yönetimi
app.use(session({
    secret: process.env.SESSION_SECRET || 'ako-vinc-production-secret-2026',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use('/admin/login', loginLimiter);

// Route'lar
app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
    res.status(404).render('admin/login', { error: 'Sayfa bulunamadı.' });
});

// Hata yakalama
app.use((err, req, res, _next) => {
    console.error('Hata:', err.message);
    res.status(500).render('admin/login', { error: 'Bir hata oluştu.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔄 Ako Vinç sitesi http://localhost:${PORT} adresinde çalışıyor.`);
    console.log(`🌐 Ortam: ${isProduction ? 'production' : 'development'}`);
});
