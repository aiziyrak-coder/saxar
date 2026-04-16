import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Create Category table
cursor.execute('''
CREATE TABLE IF NOT EXISTS inventory_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(200),
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES inventory_category(id)
)
''')

# Create Brand table
cursor.execute('''
CREATE TABLE IF NOT EXISTS inventory_brand (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(200),
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Create Product table with new fields
cursor.execute('''
CREATE TABLE IF NOT EXISTS inventory_product_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(64) UNIQUE NOT NULL,
    barcode VARCHAR(64),
    description TEXT,
    unit VARCHAR(16) DEFAULT 'kg',
    weight DECIMAL(10, 2),
    category_id INTEGER NOT NULL,
    brand_id INTEGER,
    base_price DECIMAL(14, 2) DEFAULT 0,
    b2b_price DECIMAL(14, 2) DEFAULT 0,
    cost_price DECIMAL(14, 2) DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT 1,
    is_b2b_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES inventory_category(id),
    FOREIGN KEY (brand_id) REFERENCES inventory_brand(id)
)
''')

conn.commit()
conn.close()
print("Tables created successfully!")
