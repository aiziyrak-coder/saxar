import sqlite3
import os

# Close any existing connections by removing the file
if os.path.exists('db.sqlite3'):
    os.remove('db.sqlite3')
    print("Database file removed successfully")
else:
    print("No database file found")

print("Database reset complete - run migrate to recreate tables")
