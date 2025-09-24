import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Schema de validação
export const FormulaSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  formula: z.string().min(1, 'Fórmula é obrigatória'),
  videoUrl: z.string().url('URL do vídeo inválida').or(z.literal('')),
  category: z.string().min(1, 'Categoria é obrigatória'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Formula = z.infer<typeof FormulaSchema>;

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS formulas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    formula TEXT NOT NULL,
    videoUrl TEXT,
    category TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Funções do banco de dados
export class FormulaDB {
  static generateId(): string {
    return `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getAll(): Formula[] {
    const stmt = db.prepare('SELECT * FROM formulas ORDER BY createdAt DESC');
    return stmt.all() as Formula[];
  }

  static getById(id: string): Formula | null {
    const stmt = db.prepare('SELECT * FROM formulas WHERE id = ?');
    return stmt.get(id) as Formula | null;
  }

  static getByCategory(category: string): Formula[] {
    const stmt = db.prepare('SELECT * FROM formulas WHERE category = ? ORDER BY createdAt DESC');
    return stmt.all(category) as Formula[];
  }

  static create(formula: Omit<Formula, 'id' | 'createdAt' | 'updatedAt'>): Formula {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO formulas (id, name, description, formula, videoUrl, category, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, formula.name, formula.description, formula.formula, formula.videoUrl, formula.category, now, now);
    
    return this.getById(id)!;
  }

  static update(id: string, formula: Partial<Omit<Formula, 'id' | 'createdAt' | 'updatedAt'>>): Formula | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(formula).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return existing;

    updateFields.push('updatedAt = ?');
    values.push(updatedAt, id);

    const stmt = db.prepare(`UPDATE formulas SET ${updateFields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM formulas WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static getCategories(): string[] {
    const stmt = db.prepare('SELECT DISTINCT category FROM formulas ORDER BY category');
    return stmt.all().map((row: any) => row.category);
  }
}

export default db;