module.exports = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next(); // Giriş yapılmış, devam et
    }
    res.redirect('/admin/login'); // Giriş yapılmamış, login sayfasına at
};