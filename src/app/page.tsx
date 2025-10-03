'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormulaCard } from '@/components/FormulaCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Formula, Category } from '@/lib/database';
import { Loader2, Search, TrendingUp, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const [recentFormulas, setRecentFormulas] = useState<Formula[]>([]);
  const [trendingFormulas, setTrendingFormulas] = useState<Formula[]>([]);
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
      
      const params = new URLSearchParams();
      if (selectedCategoryIds.length > 0) {
        params.set('categoryIds', selectedCategoryIds.join(','));
      }
      params.set('page', '1');
      params.set('pageSize', '12');

      const queryString = params.toString() ? `?${params.toString()}` : '';

      // Fetch recent formulas
      const recentResponse = await fetch(`/api/formulas/recent${queryString}`);
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentFormulas(recentData.map((item: Formula) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          lastCopiedAt: item.lastCopiedAt ? new Date(item.lastCopiedAt) : null,
        })));
      }

      // Fetch trending formulas
      const trendingResponse = await fetch(`/api/formulas/trending${queryString}`);
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingFormulas(trendingData.map((item: Formula) => ({
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

  const filterFormulas = (formulas: Formula[]) => {
    if (!searchTerm) return formulas;
    
    return formulas.filter(formula =>
      formula.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formula.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formula.formula.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredRecentFormulas = filterFormulas(recentFormulas);
  const filteredTrendingFormulas = filterFormulas(trendingFormulas);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Excel Manual - Fórmulas e Tutoriais
          </h1>
          
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

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Fórmulas Recentes</h2>
                <p className="text-gray-600">
                  {filteredRecentFormulas.length} {filteredRecentFormulas.length === 1 ? 'fórmula encontrada' : 'fórmulas encontradas'}
                </p>
              </div>
            </div>

            {filteredRecentFormulas.length === 0 ? (
              <div className="text-center py-12 rounded-lg border bg-white">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma fórmula encontrada
                </h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategoryIds.length > 0
                    ? 'Tente alterar os filtros ou termo de busca.'
                    : 'Copie algumas fórmulas para vê-las aqui.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                  {filteredRecentFormulas.map((formula, index) => (
                    <motion.div
                      key={formula.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <FormulaCard
                        formula={formula}
                        categories={categories}
                        showActions={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Fórmulas Mais Clicadas</h2>
                <p className="text-gray-600">
                  {filteredTrendingFormulas.length} {filteredTrendingFormulas.length === 1 ? 'fórmula encontrada' : 'fórmulas encontradas'}
                </p>
              </div>
            </div>

            {filteredTrendingFormulas.length === 0 ? (
              <div className="text-center py-12 rounded-lg border bg-white">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma fórmula encontrada
                </h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategoryIds.length > 0
                    ? 'Tente alterar os filtros ou termo de busca.'
                    : 'As fórmulas mais populares aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                  {filteredTrendingFormulas.map((formula, index) => (
                    <motion.div
                      key={formula.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <FormulaCard
                        formula={formula}
                        categories={categories}
                        showActions={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}