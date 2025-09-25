import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Schemas de validação
export const CategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  parentId: z.number().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CardSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

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

export type Category = z.infer<typeof CategorySchema> & {
  children?: Category[];
  parent?: Category;
};

export type Card = z.infer<typeof CardSchema> & {
  categories?: Category[];
  score?: number;
  totalClicks?: number;
  recentClicks?: number;
};

export type Formula = z.infer<typeof FormulaSchema>;

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parentId INTEGER DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parentId) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS card_categories (
    cardId INTEGER NOT NULL,
    categoryId INTEGER NOT NULL,
    PRIMARY KEY (cardId, categoryId),
    FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS formulas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    formula TEXT NOT NULL,
    videoUrl TEXT,
    category TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Funções do banco de dados para Categories
export class CategoryDB {
  static getAll(): Category[] {
    const stmt = db.prepare(`
      SELECT c.*, p.name as parentName 
      FROM categories c 
      LEFT JOIN categories p ON c.parentId = p.id 
      ORDER BY c.name
    `);
    const categories = stmt.all() as any[];
    
    // Organizar em árvore
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];
    
    categories.forEach(cat => {
      const category: Category = {
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        createdAt: new Date(cat.createdAt),
        updatedAt: new Date(cat.updatedAt),
        children: []
      };
      categoryMap.set(cat.id, category);
    });
    
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
          category.parent = parent;
        }
      } else {
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  }

  static getById(id: number): Category | null {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.name,
      parentId: result.parentId,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt)
    };
  }

  static create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
    const stmt = db.prepare(`
      INSERT INTO categories (name, parentId)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(category.name, category.parentId || null);
    return this.getById(result.lastInsertRowid as number)!;
  }

  static update(id: number, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Category | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(category).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return existing;

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);

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

// Funções do banco de dados para Cards
export class CardDB {
  static getAll(): Card[] {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        COUNT(cl.id) as totalClicks,
        COUNT(CASE WHEN cl.createdAt >= datetime('now', '-7 days') THEN 1 END) as recentClicks
      FROM cards c
      LEFT JOIN clicks cl ON c.id = cl.cardId
      GROUP BY c.id
      ORDER BY (COUNT(cl.id) * 0.7 + COUNT(CASE WHEN cl.createdAt >= datetime('now', '-7 days') THEN 1 END) * 1.5) DESC
    `);
    
    const cards = stmt.all() as any[];
    
    return cards.map(card => ({
      id: card.id,
      title: card.title,
      content: card.content,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt),
      totalClicks: card.totalClicks,
      recentClicks: card.recentClicks,
      score: card.totalClicks * 0.7 + card.recentClicks * 1.5,
      categories: this.getCardCategories(card.id)
    }));
  }

  static getById(id: number): Card | null {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        COUNT(cl.id) as totalClicks,
        COUNT(CASE WHEN cl.createdAt >= datetime('now', '-7 days') THEN 1 END) as recentClicks
      FROM cards c
      LEFT JOIN clicks cl ON c.id = cl.cardId
      WHERE c.id = ?
      GROUP BY c.id
    `);
    
    const result = stmt.get(id) as any;
    if (!result) return null;
    
    return {
      id: result.id,
      title: result.title,
      content: result.content,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      totalClicks: result.totalClicks,
      recentClicks: result.recentClicks,
      score: result.totalClicks * 0.7 + result.recentClicks * 1.5,
      categories: this.getCardCategories(result.id)
    };
  }

  static getCardCategories(cardId: number): Category[] {
    const stmt = db.prepare(`
      SELECT c.* FROM categories c
      JOIN card_categories cc ON c.id = cc.categoryId
      WHERE cc.cardId = ?
    `);
    
    return stmt.all(cardId) as Category[];
  }

  static create(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>, categoryIds: number[] = []): Card {
    const stmt = db.prepare(`
      INSERT INTO cards (title, content)
      VALUES (?, ?)
    `);
    
    const result = stmt.run(card.title, card.content);
    const cardId = result.lastInsertRowid as number;
    
    // Vincular categorias
    if (categoryIds.length > 0) {
      this.updateCardCategories(cardId, categoryIds);
    }
    
    return this.getById(cardId)!;
  }

  static update(id: number, card: Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt'>>, categoryIds?: number[]): Card | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(card).forEach(([key, value]) => {
      if (value !== undefined && key !== 'categories' && key !== 'score' && key !== 'totalClicks' && key !== 'recentClicks') {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length > 0) {
      updateFields.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`UPDATE cards SET ${updateFields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }

    // Atualizar categorias se fornecidas
    if (categoryIds !== undefined) {
      this.updateCardCategories(id, categoryIds);
    }

    return this.getById(id);
  }

  static updateCardCategories(cardId: number, categoryIds: number[]): void {
    // Remover categorias existentes
    const deleteStmt = db.prepare('DELETE FROM card_categories WHERE cardId = ?');
    deleteStmt.run(cardId);
    
    // Adicionar novas categorias
    if (categoryIds.length > 0) {
      const insertStmt = db.prepare('INSERT INTO card_categories (cardId, categoryId) VALUES (?, ?)');
      categoryIds.forEach(categoryId => {
        insertStmt.run(cardId, categoryId);
      });
    }
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static getByCategoryId(categoryId: number): Card[] {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        COUNT(cl.id) as totalClicks,
        COUNT(CASE WHEN cl.createdAt >= datetime('now', '-7 days') THEN 1 END) as recentClicks
      FROM cards c
      JOIN card_categories cc ON c.id = cc.cardId
      LEFT JOIN clicks cl ON c.id = cl.cardId
      WHERE cc.categoryId = ?
      GROUP BY c.id
      ORDER BY (COUNT(cl.id) * 0.7 + COUNT(CASE WHEN cl.createdAt >= datetime('now', '-7 days') THEN 1 END) * 1.5) DESC
    `);
    
    const cards = stmt.all(categoryId) as any[];
    
    return cards.map(card => ({
      id: card.id,
      title: card.title,
      content: card.content,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt),
      totalClicks: card.totalClicks,
      recentClicks: card.recentClicks,
      score: card.totalClicks * 0.7 + card.recentClicks * 1.5,
      categories: this.getCardCategories(card.id)
    }));
  }
}

// Funções do banco de dados para Clicks
export class ClickDB {
  static create(cardId: number): void {
    const stmt = db.prepare('INSERT INTO clicks (cardId) VALUES (?)');
    stmt.run(cardId);
  }

  static getCardClicks(cardId: number): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM clicks WHERE cardId = ?');
    const result = stmt.get(cardId) as any;
    return result.count;
  }
}

// Manter compatibilidade com o sistema de fórmulas existente
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