'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Filter, X } from 'lucide-react';
import { Category } from '@/lib/database';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryIds: number[];
  onSelectionChange: (categoryIds: number[]) => void;
}

export function CategoryFilter({ categories, selectedCategoryIds, onSelectionChange }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryToggle = (categoryId: number) => {
    const newSelection = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    
    onSelectionChange(newSelection);
  };

  const clearFilters = () => {
    onSelectionChange([]);
  };

  const getSelectedCategories = () => {
    return categories.filter(cat => selectedCategoryIds.includes(cat.id!));
  };

  const selectedCategories = getSelectedCategories();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar por categoria
            {selectedCategoryIds.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedCategoryIds.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          {categories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category.id}
              checked={selectedCategoryIds.includes(category.id!)}
              onCheckedChange={() => handleCategoryToggle(category.id!)}
            >
              {category.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected category badges */}
      {selectedCategories.map((category) => (
        <Badge key={category.id} variant="default" className="flex items-center gap-1">
          {category.name}
          <button
            onClick={() => handleCategoryToggle(category.id!)}
            className="ml-1 hover:bg-black/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Clear all button */}
      {selectedCategoryIds.length > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}