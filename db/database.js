const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const defaults = {
    users: [{ id: 1, username: 'admin', password: require('bcryptjs').hashSync('123456', 10) }],
    content: [{ id: 1, title: 'Ako Vinç Hizmetleri', description: 'Ağır yüklerinizi güvenle taşıyor, projelerinize güç katıyoruz.', whatsapp: '905551234567', phone: '0212 555 12 34', email: '', address: '', working_hours: '', facebook: '', instagram: '', twitter: '', youtube: '', bg_image: '', primary_color: '#f39c12', secondary_color: '#1a252f' }],
    services: [],
    gallery: [],
    testimonials: [],
    hero_slides: [],
    seo: [{ page: 'home', meta_title: 'Denizli Vinç Kiralama | Ako Vinç - Sepetli, Mobil ve Platform Vinç', meta_description: 'Denizli vinç kiralama ihtiyaçlarınız için Ako Vinç profesyonel ekibi ve geniş araç parkuru ile hizmetinizde. Sepetli vinç, mobil vinç, platform vinç kiralama için hemen teklif alın.', meta_keywords: 'denizli vinç kiralama, denizli vinç, sepetli vinç, mobil vinç, platform vinç, kiralık vinç, vinç kiralama denizli, akovinc, denizli vinç firmaları' }]
};

class DB {
    constructor() {
        this.data = JSON.parse(JSON.stringify(defaults));
        this.load();
        let changed = false;
        for (const key of Object.keys(defaults)) {
            if (!this.data[key]) {
                this.data[key] = JSON.parse(JSON.stringify(defaults[key]));
                changed = true;
            }
        }
        const homeSeo = this.data.seo && this.data.seo.find(s => s.page === 'home');
        if (homeSeo && homeSeo.meta_title === 'Ako Vinç - Profesyonel Vinç Hizmetleri') {
            Object.assign(homeSeo, JSON.parse(JSON.stringify(defaults.seo[0])));
            changed = true;
            console.log('SEO defaults güncellendi.');
        }
        if (changed) this.save();
    }

    load() {
        try {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            for (const key of Object.keys(parsed)) {
                this.data[key] = parsed[key];
            }
        } catch {
            this.save();
        }
    }

    save() {
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    }

    get(table) { return this.data[table] || []; }
    find(table, fn) { return this.get(table).find(fn) || null; }
    add(table, item) {
        const arr = this.get(table);
        const maxId = arr.length > 0 ? arr.reduce((max, x) => Math.max(max, x.id || 0), 0) : 0;
        item.id = maxId + 1;
        if (!item.created_at) item.created_at = new Date().toISOString();
        arr.push(item);
        this.data[table] = arr;
        this.save();
        return item;
    }
    update(table, fn, updates) {
        const arr = this.get(table);
        const idx = arr.findIndex(fn);
        if (idx === -1) return null;
        arr[idx] = { ...arr[idx], ...updates };
        this.data[table] = arr;
        this.save();
        return arr[idx];
    }
    remove(table, fn) {
        const arr = this.get(table);
        const idx = arr.findIndex(fn);
        if (idx === -1) return false;
        arr.splice(idx, 1);
        this.data[table] = arr;
        this.save();
        return true;
    }
    first(table) { return this.get(table)[0] || null; }
    all(table, sortFn) {
        const arr = this.get(table);
        return sortFn ? arr.sort(sortFn) : arr;
    }
}

module.exports = new DB();
