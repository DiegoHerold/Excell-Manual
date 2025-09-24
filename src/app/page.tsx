'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { FormulaCard } from '@/components/FormulaCard';
import { CardComponent } from '@/components/CardComponent';
import { Formula, Category, Card } from '@/lib/database';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomePage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredFormulas, setFilteredFormulas] = useState<Formula[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('formulas');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterContent();
  }, [formulas, cards, selectedCategory, searchTerm, activeTab]);

  const fetchData = async () => {
    try {
      const [formulasRes, cardsRes, categoriesRes] = await Promise.all([
        fetch('/api/formulas'),
        fetch('/api/cards'),
        fetch('/api/categories')
      ]);

      if (formulasRes.ok) {
        const formulasData = await formulasRes.json();
        setFormulas(formulasData);
      }

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(cardsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    // Filtrar fórmulas
    let filteredF = formulas;
    if (selectedCategory) {
      // Para fórmulas, usar o sistema antigo de categoria por string
      const selectedCat = findCategoryById(selectedCategory);
      if (selectedCat) {
        filteredF = filteredF.filter(formula => formula.category === selectedCat.name);
      }
    }

    if (searchTerm) {
      filteredF = filteredF.filter(formula =>
        formula.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formula.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formula.formula.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFormulas(filteredF);

    // Filtrar cards
    let filteredC = cards;
    if (selectedCategory) {
      filteredC = filteredC.filter(card => 
        card.categories?.some(cat => cat.id === selectedCategory)
      );
    }

    if (searchTerm) {
      filteredC = filteredC.filter(card =>
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCards(filteredC);
  };

  const findCategoryById = (id: number): Category | null => {
    const findInCategories = (cats: Category[]): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findInCategories(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInCategories(categories);
  };

  const handleFormulaDelete = (deletedId: string) => {
    setFormulas(prev => prev.filter(formula => formula.id !== deletedId));
  };

  const handleCardDelete = (deletedId: number) => {
    setCards(prev => prev.filter(card => card.id !== deletedId));
  };

  const handleCardClick = (cardId: number) => {
    // Atualizar dados após clique
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  const selectedCategoryName = selectedCategory ? findCategoryById(selectedCategory)?.name : null;

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
                  {selectedCategoryName ? `Categoria: ${selectedCategoryName}` : 'Todo o Conteúdo'}
                </h1>
                
                {/* Search */}
                <div className="relative max-w-md mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="formulas">Fórmulas ({filteredFormulas.length})</TabsTrigger>
                    <TabsTrigger value="cards">Cards ({filteredCards.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="formulas" className="mt-6">
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
                  </TabsContent>

                  <TabsContent value="cards" className="mt-6">
                    {filteredCards.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-center py-12"
                      >
                        <div className="text-gray-500 mb-4">
                          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {searchTerm || selectedCategory ? 'Nenhum card encontrado' : 'Nenhum card cadastrado'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {searchTerm || selectedCategory 
                            ? 'Tente alterar os filtros ou termo de busca.' 
                            : 'Comece adicionando seu primeiro card.'
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
                          {filteredCards.map((card, index) => (
                            <motion.div
                              key={card.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <CardComponent
                                card={card}
                                onDelete={handleCardDelete}
                                onCardClick={handleCardClick}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}