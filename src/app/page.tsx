'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormulaCard } from '@/components/FormulaCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Formula, Category } from '@/lib/database';
import { Loader2, Search, TrendingUp, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomePage() {
  const [recentFormulas, setRecentFormulas] = useState<Formula[]>([]);
  const [trendingFormulas, setTrendingFormulas] = useState<Formula[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchFormulas();
  }, [selectedCategoryIds]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFormulas();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      
      const categoryParams = selectedCategoryIds.length > 0 
        ? `?categoryIds=${selectedCategoryIds.join(',')}` 
        : '';

      // Fetch recent formulas
      const recentResponse = await fetch(`/api/formulas/recent${categoryParams}`);
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentFormulas(recentData);
      }

      // Fetch trending formulas
      const trendingResponse = await fetch(`/api/formulas/trending${categoryParams}`);
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingFormulas(trendingData);
      }
    } catch (error) {
      console.error('Error fetching formulas:', error);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Content Tabs */}
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recentes
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mais Clicados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Fórmulas Recentes
                </h2>
                <p className="text-gray-600">
                  {filteredRecentFormulas.length} {filteredRecentFormulas.length === 1 ? 'fórmula encontrada' : 'fórmulas encontradas'}
                </p>
              </div>

              {filteredRecentFormulas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <Clock className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma fórmula encontrada
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedCategoryIds.length > 0
                      ? 'Tente alterar os filtros ou termo de busca.'
                      : 'Comece copiando algumas fórmulas para vê-las aqui.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredRecentFormulas.map((formula, index) => (
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
                          showActions={false}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Fórmulas Mais Clicadas
                </h2>
                <p className="text-gray-600">
                  {filteredTrendingFormulas.length} {filteredTrendingFormulas.length === 1 ? 'fórmula encontrada' : 'fórmulas encontradas'}
                </p>
              </div>

              {filteredTrendingFormulas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <TrendingUp className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma fórmula encontrada
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedCategoryIds.length > 0
                      ? 'Tente alterar os filtros ou termo de busca.'
                      : 'As fórmulas mais populares aparecerão aqui.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredTrendingFormulas.map((formula, index) => (
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
                          showActions={false}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}