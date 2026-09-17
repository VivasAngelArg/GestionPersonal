/**
 * SERVICIO DE ALMACENAMIENTO (ABSTRACTED DATA LAYER)
 * Diseñado para cambiar a un Backend con SQL (REST API) en el futuro
 * sustituyendo las operaciones de LocalStorage por fetch('/api/...').
 */

const STORAGE_KEYS = {
    EVENTS: 'myCalendarEvents_v2',
    CATEGORIES: 'myCalendarCategories_v2'
};

const defaultCategories = [
    { id: 'cat_1', name: '🏋️‍♂️ Powerlifting', color: '#ea4335' },
    { id: 'cat_2', name: '🥗 Comidas', color: '#34a853' },
    { id: 'cat_3', name: '🔄 Rutina Diaria', color: '#fbbc04' },
    { id: 'cat_4', name: '💡 Ideas', color: '#9c27b0' }
];

export const StorageService = {
    // --- CATEGORÍAS ---
    async getCategories() {
        const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
            return defaultCategories;
        }
        return JSON.parse(data);
    },

    async saveCategory(category) {
        const categories = await this.getCategories();
        if (category.id) {
            const index = categories.findIndex(c => c.id === category.id);
            if (index !== -1) categories[index] = category;
        } else {
            category.id = 'cat_' + Date.now();
            categories.push(category);
        }
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        return category;
    },

    async deleteCategory(catId) {
        let categories = await this.getCategories();
        categories = categories.filter(c => c.id !== catId);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        return true;
    },

    // --- EVENTOS / PLANIFICACIONES DE POWERLIFTING ---
    async getEvents() {
        const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
        return data ? JSON.parse(data) : [];
    },

    async saveEvent(eventData) {
        const events = await this.getEvents();
        if (eventData.id) {
            const index = events.findIndex(e => e.id == eventData.id);
            if (index !== -1) events[index] = { ...events[index], ...eventData };
        } else {
            eventData.id = Date.now();
            events.push(eventData);
        }
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        return eventData;
    },

    async deleteEvent(eventId) {
        let events = await this.getEvents();
        events = events.filter(e => e.id != eventId);
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        return true;
    },

    // --- RESPALDO Y RESTAURACIÓN (BACKUP) ---
    async exportBackupJSON() {
        const events = await this.getEvents();
        const categories = await this.getCategories();
        const backupData = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            categories,
            events
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `backup_sistema_gestion_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    async importBackupJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (parsed.categories && parsed.events) {
                        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(parsed.categories));
                        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(parsed.events));
                        resolve(true);
                    } else {
                        reject(new Error("Formato de backup inválido."));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }
};