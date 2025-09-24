'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus, Home } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export function Sidebar({ categories, selectedCategory, onCategorySelect }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Excel Manual</h2>
            <p className="text-sm text-gray-600 mt-1">Fórmulas e tutoriais</p>
          </div>

          <div className="p-4">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="/formulas/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Fórmula
              </Link>
            </Button>
          </div>

          <nav className="flex-1 px-4 pb-4 space-y-1">
            <Button
              variant={selectedCategory === null ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onCategorySelect(null)}
            >
              <Home className="h-4 w-4 mr-2" />
              Todas as Fórmulas
            </Button>

            <div className="pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Categorias
              </h3>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'ghost'}
                  className="w-full justify-start mb-1"
                  onClick={() => onCategorySelect(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </nav>
        </div>
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
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Excel Manual</h2>
                  <p className="text-sm text-gray-600 mt-1">Fórmulas e tutoriais</p>
                </div>

                <div className="p-4">
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700" onClick={() => setIsOpen(false)}>
                    <Link href="/formulas/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Fórmula
                    </Link>
                  </Button>
                </div>

                <nav className="flex-1 px-4 pb-4 space-y-1">
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

                  <div className="pt-4">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Categorias
                    </h3>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'ghost'}
                        className="w-full justify-start mb-1"
                        onClick={() => {
                          onCategorySelect(category);
                          setIsOpen(false);
                        }}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}