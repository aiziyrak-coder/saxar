import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(inventory_product)")
columns = cursor.fetchall()
print("Current columns:", [col[1] for col in columns])

# Add missing columns
columns_to_add = [
    ('barcode', 'VARCHAR(64)'),
    ('description', 'TEXT'),
    ('weight', 'DECIMAL(10, 2)'),
    ('base_price', 'DECIMAL(14, 2) DEFAULT 0'),
    ('b2b_price', 'DECIMAL(14, 2) DEFAULT 0'),
    ('cost_price', 'DECIMAL(14, 2) DEFAULT 0'),
    ('max_stock', 'INTEGER DEFAULT 1000'),
    ('is_active', 'BOOLEAN DEFAULT 1'),
    ('is_b2b_active', 'BOOLEAN DEFAULT 1'),
    ('updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
]

existing_column_names = [col[1] for col in columns]

for col_name, col_type in columns_to_add:
    if col_name not in existing_column_names:
        try:
            cursor.execute(f'ALTER TABLE inventory_product ADD COLUMN {col_name} {col_type}')
            print(f"Added column: {col_name}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")
    else:
        print(f"Column already exists: {col_name}")

# Add foreign key columns if not exist
if 'category_id' not in existing_column_names:
    try:
        cursor.execute('ALTER TABLE inventory_product ADD COLUMN category_id INTEGER')
        print("Added column: category_id")
    except Exception as e:
        print(f"Error adding category_id: {e}")

if 'brand_id' not in existing_column_names:
    try:
        cursor.execute('ALTER TABLE inventory_product ADD COLUMN brand_id INTEGER')
        print("Added column: brand_id")
    except Exception as e:
        print(f"Error adding brand_id: {e}")

conn.commit()
conn.close()
print("Product table altered successfully!")
