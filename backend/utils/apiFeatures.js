// backend/utils/apiFeatures.js

class APIFeatures {
    constructor(query, queryString) {
        this.query = query; // SQL sorgu dizesi (örn: "SELECT * FROM products")
        this.queryString = queryString; // req.query objesi (örn: { sort: '-price', page: '1' })
        this.params = []; // SQL sorgusu için parametreler (prepared statements için)
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);

        let filterQuery = '';
        const filterParams = [];

        // Gelişmiş filtreleme (gt, gte, lt, lte)
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
        const parsedQuery = JSON.parse(queryString);

        Object.keys(parsedQuery).forEach(key => {
            if (typeof parsedQuery[key] === 'object' && parsedQuery[key] !== null) {
                Object.keys(parsedQuery[key]).forEach(operator => {
                    if (operator.startsWith('$')) {
                        const op = operator.substring(1); // '$gt' -> 'gt'
                        filterQuery += ` AND ${key} ${this._getSqlOperator(op)} ?`;
                        filterParams.push(parsedQuery[key][operator]);
                    }
                });
            } else {
                filterQuery += ` AND ${key} = ?`;
                filterParams.push(parsedQuery[key]);
            }
        });

        if (filterQuery) {
            this.query += ` WHERE 1=1${filterQuery}`; // 1=1 her zaman doğru olduğu için AND ile kolayca ekleme sağlar
            this.params.push(...filterParams);
        }

        return this;
    }

    search(fields) {
        if (this.queryString.search && fields && fields.length > 0) {
            const searchTerm = `%${this.queryString.search}%`;
            const searchConditions = fields.map(field => `${field} LIKE ?`).join(' OR ');

            if (this.query.includes('WHERE')) {
                this.query += ` AND (${searchConditions})`;
            } else {
                this.query += ` WHERE (${searchConditions})`;
            }
            // Her alan için searchTerm'i params'a ekle
            for (let i = 0; i < fields.length; i++) {
                this.params.push(searchTerm);
            }
        }
        return this;
    }

    sort(defaultSortField = 'id') { // Varsayılan sıralama alanı olarak 'id' veya 'order_date' gibi bir şey belirleyin
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').map(field => {
                const direction = field.startsWith('-') ? 'DESC' : 'ASC';
                const actualField = field.startsWith('-') ? field.substring(1) : field;
                return `${actualField} ${direction}`;
            }).join(', ');
            this.query += ` ORDER BY ${sortBy}`;
        } else {
            // Eğer req.query.sort yoksa, varsayılan sıralama alanına göre sırala
            this.query += ` ORDER BY ${defaultSortField} DESC`; // Genellikle en yeniyi üste getirmek için DESC kullanılır
        }
        return this;
    }

    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        this.query += ` LIMIT ?, ?`;
        this.params.push(skip, limit);
        return this;
    }

    fields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(', ');
            // SELECT kısmını güncellemek için bu kısım constructor'da verilen query'nin
            // SELECT kısmını değiştirecek şekilde daha akıllıca yazılmalıdır.
            // Şimdilik, sadece SELECT * FROM ... olduğu varsayımıyla çalışalım.
            // Daha karmaşık senaryolar için query'yi bir objeye dönüştürüp manipüle etmek daha iyidir.
        }
        return this;
    }

    _getSqlOperator(op) {
        switch (op) {
            case 'gt': return '>';
            case 'gte': return '>=';
            case 'lt': return '<';
            case 'lte': return '<=';
            default: return '=';
        }
    }
}

module.exports = APIFeatures;