'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus, Home, ChevronRight, ChevronDown, TrendingUp } from 'lucide-react';
import { Category, Card } from '@/lib/database';
import Link from 'next/link';

interface SidebarProps {
  categories: Category[];
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

export function Sidebar({ categories, selectedCategory, onCategorySelect }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [recentCards, setRecentCards] = useState<Card[]>([]);

  useEffect(() => {
    fetchRecentCards();
  }, []);

  const fetchRecentCards = async () => {
    try {
      const response = await fetch('/api/cards');
      if (response.ok) {
        const cards = await response.json();
        // Pegar os 5 cards com maior score
        setRecentCards(cards.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching recent cards:', error);
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id!);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id}>
        <div className="flex items-center">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 mr-1"
              onClick={() => toggleCategory(category.id!)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          <Button
            variant={isSelected ? 'default' : 'ghost'}
            className={`flex-1 justify-start text-left ${level > 0 ? 'ml-4' : ''} ${!hasChildren ? 'ml-7' : ''}`}
            onClick={() => {
              onCategorySelect(category.id!);
              setIsOpen(false);
            }}
          >
            {category.name}
          </Button>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleCardClick = async (cardId: number) => {
    try {
      await fetch('/api/clicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      });
      // Atualizar lista de recentes após o clique
      fetchRecentCards();
    } catch (error) {
      console.error('Error registering click:', error);
    }
  };

  const sidebarVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
  };

  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Excel Manual</h2>
        <p className="text-sm text-gray-600 mt-1">Fórmulas e tutoriais</p>
      </div>

      <div className="p-4">
        <Button asChild className="w-full bg-green-600 hover:bg-green-700 mb-2">
          <Link href="/formulas/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Fórmula
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/cards/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Card
          </Link>
        </Button>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        <Button
          variant={selectedCategory === null ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => {
            onCategorySelect(null);
            setIsOpen(false);
          }}
        >
          <Home className="h-4 w-4 mr-2" />
          Todas as Fórmulas
        </Button>

        {/* Seção de Recentes */}
        {recentCards.length > 0 && (
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              📌 Recentes
            </h3>
            <div className="space-y-1">
              {recentCards.map((card) => (
                <Button
                  key={card.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleCardClick(card.id!)}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium truncate w-full">
                      {card.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {card.score?.toFixed(1)} | Cliques: {card.totalClicks}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Categorias */}
        <div className="pt-4">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Categorias
          </h3>
          <div className="space-y-1">
            {categories.map(category => renderCategory(category))}
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={backdropVariants}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}