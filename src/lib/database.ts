import Database from 'better-sqlite3';
import path from 'path';
import { z } from 'zod';

const db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Configurações do SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const HALF_LIFE_DAYS = 3;
const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type FormulaRow = {
  id: string;
  name: string;
  description: string;
  formula: string;
  videoUrl: string | null;
  totalCopies: number | null;
  lastCopiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryIds: string | null;
};

type CopyEventRow = {
  formulaId: string;
  createdAt: string;
};

type CategoryRow = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// Schemas de validação
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
  lastCopiedAt: z.date().nullable().optional(),
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
export type ScoredFormula = Formula & { score: number };

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

function parseCategoryIds(rawValue: string | null): number[] {
  if (!rawValue) return [];
  return rawValue
    .split(',')
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
}

function mapFormulaRow(row: FormulaRow): Formula {
  return {
    ...row,
    totalCopies: row.totalCopies ? Number(row.totalCopies) : 0,
    categoryIds: parseCategoryIds(row.categoryIds),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    lastCopiedAt: row.lastCopiedAt ? new Date(row.lastCopiedAt) : null,
  } as Formula;
}

function buildFormulaListQuery(categoryIds?: number[]) {
  let query = `
    SELECT f.*,
           GROUP_CONCAT(DISTINCT fc.categoryId) as categoryIds
    FROM formulas f
    LEFT JOIN formula_categories fc ON f.id = fc.formulaId
  `;

  const params: unknown[] = [];

  if (categoryIds && categoryIds.length > 0) {
    query += `
      WHERE f.id IN (
        SELECT formulaId FROM formula_categories
        WHERE categoryId IN (${categoryIds.map(() => '?').join(',')})
      )
    `;
    params.push(...categoryIds);
  }

  query += '\n  GROUP BY f.id';

  return { query, params };
}

interface FormulaQueryOptions {
  categoryIds?: number[];
  orderBy?: string;
  limit?: number;
  offset?: number;
}

function fetchFormulas(options: FormulaQueryOptions = {}): Formula[] {
  const { categoryIds, orderBy, limit, offset } = options;
  const { query, params } = buildFormulaListQuery(categoryIds);

  let finalQuery = query;

  if (orderBy) {
    finalQuery += `\n  ORDER BY ${orderBy}`;
  }

  const finalParams = [...params];

  if (typeof limit === 'number' && typeof offset === 'number') {
    finalQuery += '\n  LIMIT ? OFFSET ?';
    finalParams.push(limit, offset);
  }

  const stmt = db.prepare(finalQuery);
  const rows = stmt.all(...finalParams) as FormulaRow[];
  return rows.map(mapFormulaRow);
}

function setFormulaCategories(formulaId: string, categoryIds: number[]) {
  const deleteStmt = db.prepare(`DELETE FROM formula_categories WHERE formulaId = ?`);
  deleteStmt.run(formulaId);

  if (categoryIds.length === 0) return;

  const insertStmt = db.prepare(`INSERT INTO formula_categories (formulaId, categoryId) VALUES (?, ?)`);
  for (const categoryId of categoryIds) {
    insertStmt.run(formulaId, categoryId);
  }
}

export function formatFormulaForResponse<T extends Formula | ScoredFormula>(formula: T) {
  return {
    id: formula.id,
    name: formula.name,
    description: formula.description,
    formula: formula.formula,
    videoUrl: formula.videoUrl,
    categoryIds: formula.categoryIds ?? [],
    createdAt: formula.createdAt instanceof Date ? formula.createdAt.toISOString() : formula.createdAt,
    updatedAt: formula.updatedAt instanceof Date ? formula.updatedAt.toISOString() : formula.updatedAt,
    lastCopiedAt:
      formula.lastCopiedAt instanceof Date
        ? formula.lastCopiedAt.toISOString()
        : formula.lastCopiedAt || null,
  };
}

// Funções do banco de dados
export class FormulaDB {
  static generateId(): string {
    return `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getAll(): Formula[] {
    return fetchFormulas({ orderBy: 'f.createdAt DESC' });
  }

  static getAllByCategories(categoryIds?: number[]): Formula[] {
    return fetchFormulas({ categoryIds, orderBy: 'f.createdAt DESC' });
  }

  static getById(id: string): Formula | null {
    const stmt = db.prepare(`
      SELECT f.*,
              GROUP_CONCAT(DISTINCT fc.categoryId) as categoryIds
      FROM formulas f
      LEFT JOIN formula_categories fc ON f.id = fc.formulaId
      WHERE f.id = ?
      GROUP BY f.id
    `);

    const row = stmt.get(id) as FormulaRow | undefined;
    if (!row) return null;

    return mapFormulaRow(row);
  }

  static getRecent(categoryIds?: number[], page = 1, pageSize = 20): Formula[] {
    return fetchFormulas({
      categoryIds,
      orderBy: 'COALESCE(f.lastCopiedAt, f.createdAt) DESC, f.createdAt DESC',
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  }

  static getTrending(categoryIds?: number[], page = 1, pageSize = 20): ScoredFormula[] {
    const formulas = fetchFormulas({ categoryIds });
    if (formulas.length === 0) return [];

    const fourWeeksAgo = new Date(Date.now() - FOUR_WEEKS_MS).toISOString();
    const idsPlaceholders = formulas.map(() => '?').join(',');

    const eventsByFormula = new Map<string, Date[]>();

    if (idsPlaceholders.length > 0) {
      const eventsStmt = db.prepare(
        `SELECT formulaId, createdAt FROM copy_events WHERE formulaId IN (${idsPlaceholders}) AND createdAt >= ?`
      );

      const rows = eventsStmt.all(
        ...formulas.map((formula) => formula.id),
        fourWeeksAgo
      ) as CopyEventRow[];

      for (const row of rows) {
        const current = eventsByFormula.get(row.formulaId) ?? [];
        current.push(new Date(row.createdAt));
        eventsByFormula.set(row.formulaId, current);
      }
    }

    const now = Date.now();
    const decayFactor = Math.log(2) / HALF_LIFE_DAYS;

    const scored = formulas.map((formula) => {
      const events = eventsByFormula.get(formula.id) ?? [];
      const recencyScore = events.reduce((total, eventDate) => {
        const deltaDays = (now - eventDate.getTime()) / MS_PER_DAY;
        return total + Math.exp(-decayFactor * deltaDays);
      }, 0);

      const popularityScore = Math.log10((formula.totalCopies ?? 0) + 1);
      const score = 0.3 * popularityScore + 0.7 * recencyScore;

      return { ...formula, score } as ScoredFormula;
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const aDate = a.lastCopiedAt ?? a.createdAt;
      const bDate = b.lastCopiedAt ?? b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

    const start = (page - 1) * pageSize;
    return scored.slice(start, start + pageSize);
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
        setFormulaCategories(id, formula.categoryIds);
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
      const values: unknown[] = [];

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
        setFormulaCategories(id, formula.categoryIds);
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
    const rows = stmt.all() as CategoryRow[];
    return rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })) as Category[];
  }

  static getById(id: number): Category | null {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const row = stmt.get(id) as CategoryRow | undefined;
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
    const values: unknown[] = [];

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

function seedDatabase() {
  const categoryCountRow = db
    .prepare('SELECT COUNT(*) as count FROM categories')
    .get() as { count: number };

  if (categoryCountRow.count === 0) {
    const sampleCategories = [
      { name: 'Funções Básicas', description: 'Fórmulas essenciais para começar no Excel.' },
      { name: 'Busca e Referência', description: 'Localize dados rapidamente em tabelas grandes.' },
      { name: 'Lógica Condicional', description: 'Construa planilhas inteligentes com condições.' },
    ];

    const insertCategory = db.prepare(
      `INSERT INTO categories (name, description, createdAt, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    );

    const insertCategoriesTransaction = db.transaction(() => {
      for (const category of sampleCategories) {
        insertCategory.run(category.name, category.description);
      }
    });

    insertCategoriesTransaction();
  }

  const formulaCountRow = db
    .prepare('SELECT COUNT(*) as count FROM formulas')
    .get() as { count: number };

  if (formulaCountRow.count === 0) {
    const categories = CategoryDB.getAll();
    const categoriesByName = new Map(categories.map((category) => [category.name, category.id]));

    const sampleFormulas = [
      {
        name: 'Soma Total de Vendas',
        description: 'Calcule rapidamente o total de vendas em um intervalo de células.',
        formula: '=SOMA(B2:B101)',
        videoUrl: '',
        categoryNames: ['Funções Básicas'],
      },
      {
        name: 'Buscar Produto pelo Código',
        description: 'Encontre informações de um produto usando PROCV em uma tabela de referência.',
        formula: '=PROCV(E2;Produtos!A:D;3;FALSO)',
        videoUrl: '',
        categoryNames: ['Busca e Referência'],
      },
      {
        name: 'Classificação por Meta Batida',
        description: 'Identifique quem atingiu a meta com uma lógica condicional simples.',
        formula: '=SE(C2>=D2;"Meta atingida";"Em progresso")',
        videoUrl: '',
        categoryNames: ['Lógica Condicional', 'Funções Básicas'],
      },
    ];

    for (const sample of sampleFormulas) {
      const categoryIds = sample.categoryNames
        .map((name) => categoriesByName.get(name))
        .filter((id): id is number => typeof id === 'number');

      if (categoryIds.length === 0) {
        continue;
      }

      FormulaDB.create({
        name: sample.name,
        description: sample.description,
        formula: sample.formula,
        videoUrl: sample.videoUrl,
        categoryIds,
      });
    }
  }
}

seedDatabase();

export default db;
