import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Configurações do SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema de validação
export const FormulaSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  formula: z.string().min(1, 'Fórmula é obrigatória'),
  videoUrl: z.string().url('URL do vídeo inválida').or(z.literal('')),
  categoryIds: z.array(z.number()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  totalCopies: z.number().optional(),
  lastCopiedAt: z.date().optional(),
});

export const CategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CopyEventSchema = z.object({
  id: z.number().optional(),
  formulaId: z.string(),
  sessionId: z.string(),
  createdAt: z.date().optional(),
});

export type Formula = z.infer<typeof FormulaSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CopyEvent = z.infer<typeof CopyEventSchema>;

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS formulas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    formula TEXT NOT NULL,
    videoUrl TEXT,
    totalCopies INTEGER DEFAULT 0,
    lastCopiedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS formula_categories (
    formulaId TEXT NOT NULL,
    categoryId INTEGER NOT NULL,
    PRIMARY KEY (formulaId, categoryId),
    FOREIGN KEY (formulaId) REFERENCES formulas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS copy_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    formulaId TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formulaId) REFERENCES formulas(id) ON DELETE CASCADE
  )
`);

// Índices para performance
db.exec(`CREATE INDEX IF NOT EXISTS idx_copy_events_formula_session ON copy_events(formulaId, sessionId)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_copy_events_created_at ON copy_events(createdAt)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_formulas_last_copied ON formulas(lastCopiedAt)`);

// Funções do banco de dados
export class FormulaDB {
  static generateId(): string {
    return `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getAll(): Formula[] {
    const stmt = db.prepare(`
      SELECT f.*, 
             GROUP_CONCAT(fc.categoryId) as categoryIds
      FROM formulas f
      LEFT JOIN formula_categories fc ON f.id = fc.formulaId
      GROUP BY f.id
      ORDER BY f.createdAt DESC
    `);
    
    return stmt.all().map((row: any) => ({
      ...row,
      categoryIds: row.categoryIds ? row.categoryIds.split(',').map(Number) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastCopiedAt: row.lastCopiedAt ? new Date(row.lastCopiedAt) : null,
    })) as Formula[];
  }

  static getById(id: string): Formula | null {
    const stmt = db.prepare(`
      SELECT f.*, 
             GROUP_CONCAT(fc.categoryId) as categoryIds
      FROM formulas f
      LEFT JOIN formula_categories fc ON f.id = fc.formulaId
      WHERE f.id = ?
      GROUP BY f.id
    `);
    
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      ...row,
      categoryIds: row.categoryIds ? row.categoryIds.split(',').map(Number) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastCopiedAt: row.lastCopiedAt ? new Date(row.lastCopiedAt) : null,
    } as Formula;
  }

  static getRecent(categoryIds?: number[], page = 1, pageSize = 20): Formula[] {
    let query = `
      SELECT DISTINCT f.*, 
             GROUP_CONCAT(fc.categoryId) as categoryIds
      FROM formulas f
      LEFT JOIN formula_categories fc ON f.id = fc.formulaId
    `;
    
    const params: any[] = [];
    
    if (categoryIds && categoryIds.length > 0) {
      query += ` WHERE fc.categoryId IN (${categoryIds.map(() => '?').join(',')})`;
      params.push(...categoryIds);
    }
    
    query += `
      GROUP BY f.id
      ORDER BY f.lastCopiedAt DESC NULLS LAST, f.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(pageSize, (page - 1) * pageSize);
    
    const stmt = db.prepare(query);
    return stmt.all(...params).map((row: any) => ({
      ...row,
      categoryIds: row.categoryIds ? row.categoryIds.split(',').map(Number) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastCopiedAt: row.lastCopiedAt ? new Date(row.lastCopiedAt) : null,
    })) as Formula[];
  }

  static getTrending(categoryIds?: number[], page = 1, pageSize = 20): Formula[] {
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
    
    let query = `
      SELECT DISTINCT f.*, 
             GROUP_CONCAT(DISTINCT fc.categoryId) as categoryIds,
             COUNT(DISTINCT ce.id) as recentCopies,
             (
               LOG10(f.totalCopies + 1) * 0.3 + 
               COUNT(DISTINCT ce.id) * EXP(-0.231 * (julianday('now') - julianday(COALESCE(f.lastCopiedAt, f.createdAt)))) * 0.7
             ) as score
      FROM formulas f
      LEFT JOIN formula_categories fc ON f.id = fc.formulaId
      LEFT JOIN copy_events ce ON f.id = ce.formulaId AND ce.createdAt >= ?
    `;
    
    const params: any[] = [fourWeeksAgo];
    
    if (categoryIds && categoryIds.length > 0) {
      query += ` WHERE fc.categoryId IN (${categoryIds.map(() => '?').join(',')})`;
      params.push(...categoryIds);
    }
    
    query += `
      GROUP BY f.id
      ORDER BY score DESC, f.totalCopies DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(pageSize, (page - 1) * pageSize);
    
    const stmt = db.prepare(query);
    return stmt.all(...params).map((row: any) => ({
      ...row,
      categoryIds: row.categoryIds ? row.categoryIds.split(',').map(Number) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastCopiedAt: row.lastCopiedAt ? new Date(row.lastCopiedAt) : null,
    })) as Formula[];
  }

  static create(formula: Omit<Formula, 'id' | 'createdAt' | 'updatedAt'>): Formula {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO formulas (id, name, description, formula, videoUrl, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(id, formula.name, formula.description, formula.formula, formula.videoUrl, now, now);
      
      if (formula.categoryIds && formula.categoryIds.length > 0) {
        const categoryStmt = db.prepare(`
          INSERT INTO formula_categories (formulaId, categoryId) VALUES (?, ?)
        `);
        
        for (const categoryId of formula.categoryIds) {
          categoryStmt.run(id, categoryId);
        }
      }
    });
    
    transaction();
    return this.getById(id)!;
  }

  static update(id: string, formula: Partial<Omit<Formula, 'id' | 'createdAt' | 'updatedAt'>>): Formula | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();
    
    const transaction = db.transaction(() => {
      const updateFields: string[] = [];
      const values: any[] = [];

      Object.entries(formula).forEach(([key, value]) => {
        if (value !== undefined && key !== 'categoryIds') {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updateFields.length > 0) {
        updateFields.push('updatedAt = ?');
        values.push(updatedAt, id);

        const stmt = db.prepare(`UPDATE formulas SET ${updateFields.join(', ')} WHERE id = ?`);
        stmt.run(...values);
      }

      if (formula.categoryIds !== undefined) {
        // Remove existing categories
        const deleteStmt = db.prepare(`DELETE FROM formula_categories WHERE formulaId = ?`);
        deleteStmt.run(id);
        
        // Add new categories
        if (formula.categoryIds.length > 0) {
          const insertStmt = db.prepare(`INSERT INTO formula_categories (formulaId, categoryId) VALUES (?, ?)`);
          for (const categoryId of formula.categoryIds) {
            insertStmt.run(id, categoryId);
          }
        }
      }
    });
    
    transaction();
    return this.getById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM formulas WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static recordCopy(formulaId: string, sessionId: string): boolean {
    // Check if copy was made in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const recentCopyStmt = db.prepare(`
      SELECT id FROM copy_events 
      WHERE formulaId = ? AND sessionId = ? AND createdAt > ?
    `);
    
    if (recentCopyStmt.get(formulaId, sessionId, tenSecondsAgo)) {
      return false; // Rate limited
    }

    const transaction = db.transaction(() => {
      // Insert copy event
      const eventStmt = db.prepare(`
        INSERT INTO copy_events (formulaId, sessionId) VALUES (?, ?)
      `);
      eventStmt.run(formulaId, sessionId);

      // Update formula stats
      const updateStmt = db.prepare(`
        UPDATE formulas 
        SET totalCopies = totalCopies + 1, 
            lastCopiedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      updateStmt.run(formulaId);
    });

    transaction();
    return true;
  }
}

export class CategoryDB {
  static getAll(): Category[] {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    return stmt.all().map((row: any) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })) as Category[];
  }

  static getById(id: number): Category | null {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as Category;
  }

  static create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO categories (name, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(category.name, category.description || null, now, now);
    return this.getById(result.lastInsertRowid as number)!;
  }

  static update(id: number, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Category | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(category).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return existing;

    updateFields.push('updatedAt = ?');
    values.push(updatedAt, id);

    const stmt = db.prepare(`UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id);
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export default db;