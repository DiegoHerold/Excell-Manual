'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormulaCard } from '@/components/FormulaCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Formula, Category } from '@/lib/database';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default function FormulasAdminPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.map((category: Category) => ({
          ...category,
          createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
          updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
        })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchFormulas = useCallback(async () => {
    try {
      setLoading(true);
      
      const categoryParams = selectedCategoryIds.length > 0 
        ? `?categoryIds=${selectedCategoryIds.join(',')}` 
        : '';

      const response = await fetch(`/api/formulas${categoryParams}`);
      if (response.ok) {
        const data = await response.json();
        setFormulas(data.map((item: Formula) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          lastCopiedAt: item.lastCopiedAt ? new Date(item.lastCopiedAt) : null,
        })));
      }
    } catch (error) {
      console.error('Error fetching formulas:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryIds]);

  const initialSearch = useRef(true);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchFormulas();
  }, [fetchFormulas]);

  useEffect(() => {
    if (initialSearch.current) {
      initialSearch.current = false;
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchFormulas();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, fetchFormulas]);

  const handleFormulaDelete = (deletedId: string) => {
    setFormulas(prev => prev.filter(formula => formula.id !== deletedId));
  };

  const filterFormulas = (formulas: Formula[]) => {
    if (!searchTerm) return formulas;
    
    return formulas.filter(formula =>
      formula.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formula.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formula.formula.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredFormulas = filterFormulas(formulas);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando fórmulas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Fórmulas</h1>
              <p className="text-gray-600 mt-2">Crie, edite e organize as fórmulas do Excel</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">Voltar ao Início</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/categories">Gerenciar Categorias</Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/formulas/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fórmula
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Pesquisar fórmulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onSelectionChange={setSelectedCategoryIds}
          />
        </motion.div>

        {/* Results Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-gray-600">
            {filteredFormulas.length} {filteredFormulas.length === 1 ? 'fórmula encontrada' : 'fórmulas encontradas'}
          </p>
        </motion.div>

        {/* Cards Grid */}
        {filteredFormulas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategoryIds.length > 0 ? 'Nenhuma fórmula encontrada' : 'Nenhuma fórmula cadastrada'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategoryIds.length > 0 
                ? 'Tente alterar os filtros ou termo de busca.' 
                : 'Comece adicionando sua primeira fórmula do Excel.'
              }
            </p>
            {!searchTerm && selectedCategoryIds.length === 0 && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/formulas/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Fórmula
                </Link>
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredFormulas.map((formula, index) => (
              <motion.div
                key={formula.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <FormulaCard
                  formula={formula}
                  categories={categories}
                  onDelete={handleFormulaDelete}
                  showActions={true}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}