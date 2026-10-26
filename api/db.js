import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_PATH = path.resolve(__dirname, '..', 'leads.sqlite');

let dbPromise = null;

export async function initDb(db) {
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA busy_timeout = 5000;');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      link TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Novo',
      data_criacao TEXT NOT NULL
    );
  `);
  return db;
}

export async function getDb(customPath) {
  if (customPath) {
    const db = await open({
      filename: customPath,
      driver: sqlite3.Database
    });
    await initDb(db);
    return db;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await open({
        filename: DEFAULT_DB_PATH,
        driver: sqlite3.Database
      });
      await initDb(db);
      return db;
    })();
  }

  return dbPromise;
}

export async function closeDb(targetDb) {
  if (targetDb) {
    await targetDb.close();
    return;
  }
  if (dbPromise) {
    const db = await dbPromise;
    await db.close();
    dbPromise = null;
  }
}
