'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, TrendingUp, MousePointer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/lib/database';
import Link from 'next/link';

interface CardComponentProps {
  card: Card;
  onDelete?: (id: number) => void;
  onCardClick?: (id: number) => void;
}

export function CardComponent({ card, onDelete, onCardClick }: CardComponentProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Card excluído!",
          description: "O card foi excluído com sucesso.",
        });
        onDelete?.(card.id!);
      } else {
        throw new Error('Erro ao excluir');
      }
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o card.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = async () => {
    try {
      await fetch('/api/clicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId: card.id }),
      });
      onCardClick?.(card.id!);
    } catch (error) {
      console.error('Error registering click:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <UICard className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleCardClick}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {card.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1 line-clamp-2">
                {card.content}
              </CardDescription>
            </div>
          </div>
          
          {/* Categorias */}
          {card.categories && card.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.categories.map((category) => (
                <Badge key={category.id} variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Estatísticas */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <MousePointer className="h-4 w-4 mr-1" />
                <span>Cliques: {card.totalClicks || 0}</span>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Score: {card.score?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
            {card.recentClicks !== undefined && card.recentClicks > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {card.recentClicks} cliques nos últimos 7 dias
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2 mt-auto" onClick={(e) => e.stopPropagation()}>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/cards/${card.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Link>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza de que deseja excluir o card "{card.title}"? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </UICard>
    </motion.div>
  );
}