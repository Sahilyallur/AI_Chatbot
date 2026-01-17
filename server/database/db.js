import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

// Initialize database connection
export async function initializeDatabase() {
    // Use Turso in production, local SQLite file in development
    const isProduction = process.env.NODE_ENV === 'production' || process.env.TURSO_DATABASE_URL;

    if (isProduction && process.env.TURSO_DATABASE_URL) {
        // Connect to Turso cloud database
        db = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
        });
        console.log('✓ Connected to Turso cloud database');
    } else {
        // Use local SQLite file for development
        const dbPath = path.join(__dirname, 'chatbot.db');
        db = createClient({
            url: `file:${dbPath}`
        });
        console.log('✓ Connected to local SQLite database');
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute each statement separately
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await db.execute(statement);
            } catch (e) {
                // Ignore "table already exists" errors
                if (!e.message.includes('already exists')) {
                    console.error('Schema error:', e.message);
                }
            }
        }
    }

    console.log('✓ Database initialized successfully');
    return db;
}

// Helper class to mimic better-sqlite3 API for compatibility
class Statement {
    constructor(database, sql) {
        this.db = database;
        this.sql = sql;
    }

    async run(...params) {
        try {
            // Flatten params if they're passed as an array
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            const result = await this.db.execute({
                sql: this.sql,
                args: flatParams
            });

            return { lastInsertRowid: Number(result.lastInsertRowid) || 0 };
        } catch (e) {
            console.error('DB run error:', e.message, 'SQL:', this.sql);
            throw e;
        }
    }

    async get(...params) {
        try {
            // Flatten params if they're passed as an array
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

            const result = await this.db.execute({
                sql: this.sql,
                args: flatParams
            });

            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return undefined;
        } catch (e) {
            console.error('DB get error:', e.message, 'SQL:', this.sql, 'Params:', params);
            throw e;
        }
    }

    async all(...params) {
        try {
            // Flatten params if they're passed as an array
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

            const result = await this.db.execute({
                sql: this.sql,
                args: flatParams
            });

            return result.rows;
        } catch (e) {
            console.error('DB all error:', e.message, 'SQL:', this.sql, 'Params:', params);
            throw e;
        }
    }
}

// Database wrapper to mimic better-sqlite3 API
const dbWrapper = {
    prepare(sql) {
        return new Statement(db, sql);
    },
    async exec(sql) {
        await db.execute(sql);
    }
};

// Export the wrapper as default
export default dbWrapper;

// Also export raw db access if needed
export function getRawDb() {
    return db;
}
