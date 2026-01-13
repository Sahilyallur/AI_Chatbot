import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, 'chatbot.db');

let db = null;

// Initialize database
export async function initializeDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute each statement separately
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
        if (statement.trim()) {
            try {
                db.run(statement);
            } catch (e) {
                // Ignore "table already exists" errors
                if (!e.message.includes('already exists')) {
                    console.error('Schema error:', e.message);
                }
            }
        }
    }

    // Save to file
    saveDatabase();

    console.log('✓ Database initialized successfully');
    return db;
}

// Save database to file
export function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Helper class to mimic better-sqlite3 API
class Statement {
    constructor(database, sql) {
        this.db = database;
        this.sql = sql;
    }

    run(...params) {
        try {
            // Flatten params if they're passed as an array
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            this.db.run(this.sql, flatParams);
            saveDatabase();

            // Get last insert rowid
            const result = this.db.exec('SELECT last_insert_rowid() as id');
            const lastInsertRowid = result.length > 0 && result[0].values.length > 0
                ? result[0].values[0][0]
                : 0;

            return { lastInsertRowid };
        } catch (e) {
            console.error('DB run error:', e.message, 'SQL:', this.sql);
            throw e;
        }
    }

    get(...params) {
        try {
            // Flatten params if they're passed as an array
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

            const stmt = this.db.prepare(this.sql);
            if (flatParams.length > 0) {
                stmt.bind(flatParams);
            }

            if (stmt.step()) {
                const row = stmt.getAsObject();
                stmt.free();
                return row;
            }
            stmt.free();
            return undefined;
        } catch (e) {
            console.error('DB get error:', e.message, 'SQL:', this.sql, 'Params:', params);
            throw e;
        }
    }

    all(...params) {
        try {
            // Flatten params if they're passed as an array
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

            const stmt = this.db.prepare(this.sql);
            if (flatParams.length > 0) {
                stmt.bind(flatParams);
            }

            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
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
    exec(sql) {
        db.run(sql);
        saveDatabase();
    }
};

// Export the wrapper as default
export default dbWrapper;

// Also export raw db access if needed
export function getRawDb() {
    return db;
}
