"""
SQLite-based cache for AI/LLM responses in OptiSchema.
Caches OpenAI responses to reduce cost and latency.
"""

import os
import sqlite3
import threading
import time
from typing import Optional, Any
from config import settings

CACHE_DB_PATH = os.path.join(os.path.dirname(__file__), 'llm_cache.sqlite3')
CACHE_TTL = getattr(settings, 'cache_ttl', 3600)  # seconds
CACHE_SIZE = getattr(settings, 'cache_size', 1000)

# Ensure thread safety
cache_lock = threading.Lock()

def _init_db():
    with cache_lock:
        conn = sqlite3.connect(CACHE_DB_PATH)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                created_at INTEGER
            )
        ''')
        conn.commit()
        conn.close()

_init_db()

def make_cache_key(fingerprint: str, analysis_type: str) -> str:
    return f"{fingerprint}:{analysis_type}"

def get_cache(key: str) -> Optional[str]:
    now = int(time.time())
    with cache_lock:
        conn = sqlite3.connect(CACHE_DB_PATH)
        c = conn.cursor()
        c.execute('SELECT value, created_at FROM cache WHERE key = ?', (key,))
        row = c.fetchone()
        conn.close()
    if row:
        value, created_at = row
        if now - created_at < CACHE_TTL:
            return value
        else:
            # Expired, delete
            delete_cache(key)
    return None

def set_cache(key: str, value: str):
    now = int(time.time())
    with cache_lock:
        conn = sqlite3.connect(CACHE_DB_PATH)
        c = conn.cursor()
        c.execute('REPLACE INTO cache (key, value, created_at) VALUES (?, ?, ?)', (key, value, now))
        conn.commit()
        # Enforce cache size
        c.execute('SELECT COUNT(*) FROM cache')
        count = c.fetchone()[0]
        if count > CACHE_SIZE:
            c.execute('DELETE FROM cache WHERE key IN (SELECT key FROM cache ORDER BY created_at ASC LIMIT ?)', (count - CACHE_SIZE,))
            conn.commit()
        conn.close()

def delete_cache(key: str):
    with cache_lock:
        conn = sqlite3.connect(CACHE_DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM cache WHERE key = ?', (key,))
        conn.commit()
        conn.close()

def clear_cache():
    with cache_lock:
        conn = sqlite3.connect(CACHE_DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM cache')
        conn.commit()
        conn.close() 