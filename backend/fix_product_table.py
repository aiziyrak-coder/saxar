import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Add created_at column
try:
    cursor.execute('ALTER TABLE inventory_product ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    print("Added column: created_at")
except Exception as e:
    print(f"Error: {e}")

conn.commit()
conn.close()
print("Done!")
