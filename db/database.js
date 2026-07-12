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
    seo: [{ page: 'home', meta_title: 'Ako Vinç - Profesyonel Vinç Hizmetleri', meta_description: 'Ako Vinç ile ağır yüklerinizi güvenle taşıyın.', meta_keywords: 'vinç, vinç kiralama, sepetli vinç, mobil vinç' }]
};

class DB {
    constructor() {
        this.data = {};
        this.load();
    }

    load() {
        try {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            this.data = JSON.parse(raw);
        } catch {
            this.data = JSON.parse(JSON.stringify(defaults));
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
        if (arr.length > 0) {
            const maxId = arr.reduce((max, x) => Math.max(max, x.id || 0), 0);
            item.id = maxId + 1;
        } else {
            item.id = 1;
        }
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
        if (sortFn) return arr.sort(sortFn);
        return arr;
    }
}

module.exports = new DB();
