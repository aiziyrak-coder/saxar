import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Drop the temp table if exists
cursor.execute('DROP TABLE IF EXISTS inventory_product_new')

# Check the current schema
cursor.execute("PRAGMA table_info(inventory_product)")
columns = cursor.fetchall()
print("Current columns:", [col[1] for col in columns])

# Create new table without the old 'category' column
cursor.execute('''
CREATE TABLE inventory_product_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(64) UNIQUE NOT NULL,
    barcode VARCHAR(64),
    description TEXT,
    unit VARCHAR(16) DEFAULT 'kg',
    weight DECIMAL(10, 2),
    category_id INTEGER,
    brand_id INTEGER,
    base_price DECIMAL(14, 2) DEFAULT 0,
    b2b_price DECIMAL(14, 2) DEFAULT 0,
    cost_price DECIMAL(14, 2) DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT 1,
    is_b2b_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Copy data from old table to new table (excluding old 'category' column)
cursor.execute('''
INSERT INTO inventory_product_new (
    id, name, sku, barcode, description, unit, weight, category_id, brand_id,
    base_price, b2b_price, cost_price, min_stock, max_stock, is_active, is_b2b_active
)
SELECT 
    id, name, sku, barcode, description, unit, weight, category_id, brand_id,
    base_price, b2b_price, cost_price, min_stock, max_stock, is_active, is_b2b_active
FROM inventory_product
''')

# Drop old table
cursor.execute('DROP TABLE inventory_product')

# Rename new table to old name
cursor.execute('ALTER TABLE inventory_product_new RENAME TO inventory_product')

conn.commit()
conn.close()
print("Product table fixed successfully!")
