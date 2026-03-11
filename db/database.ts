import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('pocketdex.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS discoveries (
      id TEXT PRIMARY KEY NOT NULL,
      animal_name TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      description TEXT NOT NULL,
      habitat TEXT NOT NULL,
      diet TEXT NOT NULL,
      behavior TEXT NOT NULL,
      rarity TEXT NOT NULL,
      confidence REAL NOT NULL,
      biome TEXT NOT NULL,
      image_uri TEXT NOT NULL,
      detected_at TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      favorite INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      stats_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_discoveries_rarity ON discoveries(rarity);
    CREATE INDEX IF NOT EXISTS idx_discoveries_biome ON discoveries(biome);
    CREATE INDEX IF NOT EXISTS idx_discoveries_detected_at ON discoveries(detected_at);
  `);
}
