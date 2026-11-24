import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const expoDb = SQLite.openDatabaseSync('second_brain.db');

// Enforce foreign keys (cascade deletes) on every SQLite connection session
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
