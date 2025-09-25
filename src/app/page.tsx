'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { FormulaCard } from '@/components/FormulaCard';
import { Formula } from '@/lib/database';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [filteredFormulas, setFilteredFormulas] = useState<Formula[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormulas();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterFormulas();
  }, [formulas, selectedCategory, searchTerm]);

  const fetchFormulas = async () => {
    try {
      const response = await fetch('/api/formulas');
      if (response.ok) {
        const data = await response.json();
        setFormulas(data);
      }
    } catch (error) {
      console.error('Error fetching formulas:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filterFormulas = () => {
    let filtered = formulas;

    if (selectedCategory) {
      filtered = filtered.filter(formula => formula.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(formula =>
        formula.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formula.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formula.formula.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFormulas(filtered);
  };

  const handleFormulaDelete = (deletedId: string) => {
    setFormulas(prev => prev.filter(formula => formula.id !== deletedId));
    fetchCategories(); // Atualiza categorias após exclusão
  };

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
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <main className="flex-1 lg:ml-0">
        <div className="pt-16 lg:pt-0 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedCategory ? `Categoria: ${selectedCategory}` : 'Todas as Fórmulas'}
                </h1>
                
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pesquisar fórmulas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </motion.div>
            </div>

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
                  {searchTerm || selectedCategory ? 'Nenhuma fórmula encontrada' : 'Nenhuma fórmula cadastrada'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory 
                    ? 'Tente alterar os filtros ou termo de busca.' 
                    : 'Comece adicionando sua primeira fórmula do Excel.'
                  }
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
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
                        onDelete={handleFormulaDelete}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}