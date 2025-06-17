class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.params = [];
    }

    // 1. Filtreleme
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);

        let filterConditions = [];

        Object.keys(queryObj).forEach(key => {
            let value = queryObj[key];

            // ✅ category_id özel kontrolü (tek veya çoklu değer)
            if (key === 'category_id') {
                const values = value.split(',').map(v => parseInt(v.trim(), 10));
                const placeholders = values.map(() => '?').join(', ');
                filterConditions.push(`${key} IN (${placeholders})`);
                this.params.push(...values);
            }

            // ✅ min/max (örn. price_min, stock_quantity_max)
            else if (key.includes('_')) {
                const [field, operator] = key.split('_');
                const parsedValue = isNaN(value) ? value : parseFloat(value);
                if (operator === 'min') {
                    filterConditions.push(`${field} >= ?`);
                    this.params.push(parsedValue);
                } else if (operator === 'max') {
                    filterConditions.push(`${field} <= ?`);
                    this.params.push(parsedValue);
                }
            }

            // ✅ Çoklu değer (örn. status=active,inactive)
            else if (typeof value === 'string' && value.includes(',')) {
                const values = value.split(',').map(v => v.trim());
                const placeholders = values.map(() => '?').join(', ');
                filterConditions.push(`${key} IN (${placeholders})`);
                this.params.push(...values);
            }

            // ✅ Tekli değer eşitlik kontrolü
            else {
                const parsedValue = isNaN(value) ? value : parseInt(value, 10);
                filterConditions.push(`${key} = ?`);
                this.params.push(parsedValue);
            }
        });

        if (filterConditions.length > 0) {
            if (this.query.includes('WHERE')) {
                this.query += ` AND ${filterConditions.join(' AND ')}`;
            } else {
                this.query += ` WHERE ${filterConditions.join(' AND ')}`;
            }
        }

        return this;
    }

    // 2. Arama
    search(searchFields) {
        if (this.queryString.search) {
            const searchTerm = `%${this.queryString.search}%`;
            let searchConditions = [];

            searchFields.forEach(field => {
                searchConditions.push(`${field} LIKE ?`);
                this.params.push(searchTerm);
            });

            if (searchConditions.length > 0) {
                if (this.query.includes('WHERE')) {
                    this.query += ` AND (${searchConditions.join(' OR ')})`;
                } else {
                    this.query += ` WHERE (${searchConditions.join(' OR ')})`;
                }
            }
        }
        return this;
    }

    // 3. Sıralama
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').map(el => {
                let order = 'ASC';
                let field = el.trim();
                if (field.startsWith('-')) {
                    order = 'DESC';
                    field = field.substring(1);
                }
                return `${field} ${order}`;
            }).join(', ');
            this.query += ` ORDER BY ${sortBy}`;
        } else {
            this.query += ` ORDER BY created_at DESC`;
        }
        return this;
    }

    // 4. Sayfalama
    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        this.query += ` LIMIT ?, ?`;
        this.params.push(skip, limit);

        return this;
    }
}

module.exports = APIFeatures;
