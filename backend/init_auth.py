from sqlalchemy import create_client, Column, Integer, String, Boolean
import sqlite3
import os

db_url = ".deer-flow/users.db"
conn = sqlite3.connect(db_url)
cursor = conn.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT,
    hashed_password TEXT,
    disabled INTEGER DEFAULT 0
)''')
conn.commit()
conn.close()
print("数据库初始化完成")
