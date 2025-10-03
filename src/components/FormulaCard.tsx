'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Copy, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Formula, Category } from '@/lib/database';
import Link from 'next/link';

interface FormulaCardProps {
  formula: Formula;
  categories?: Category[];
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function FormulaCard({ formula, categories = [], onDelete, showActions = true }: FormulaCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const copyFormula = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    
    try {
      await navigator.clipboard.writeText(formula.formula);
      
      // Record the copy event only if clipboard write was successful
      try {
        await fetch('/api/metrics/copy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ formulaId: formula.id }),
        });
      } catch (error) {
        console.error('Error recording copy:', error);
        // Don't show error to user, just log it
      }
      
      toast({
        title: "Fórmula copiada!",
        description: "A fórmula foi copiada para a área de transferência.",
      });
    } catch (error) {
      console.error('Error copying formula:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a fórmula.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/formulas/${formula.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Fórmula excluída!",
          description: "A fórmula foi excluída com sucesso.",
        });
        onDelete?.(formula.id!);
      } else {
        throw new Error('Erro ao excluir');
      }
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a fórmula.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFormulaCategories = () => {
    if (!formula.categoryIds || !categories.length) return [];
    return categories.filter(cat => formula.categoryIds!.includes(cat.id!));
  };

  const formulaCategories = getFormulaCategories();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {formula.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                {formula.description}
              </CardDescription>
            </div>
          </div>
          
          {/* Categories */}
          {formulaCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formulaCategories.map((category) => (
                <Badge key={category.id} variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Fórmula */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Fórmula</span>
              <Button
                size="sm"
                variant="outline"
                onClick={copyFormula}
                disabled={isCopying}
                className="h-7 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                {isCopying ? 'Copiando...' : 'Copiar'}
              </Button>
            </div>
            <code className="text-sm font-mono text-gray-800 break-all">
              {formula.formula}
            </code>
          </div>

          {/* Vídeo */}
          {formula.videoUrl && (
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="aspect-video">
                {formula.videoUrl.includes('youtube.com') || formula.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={formula.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    title={formula.name}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={formula.videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                  />
                )}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          {showActions && (
            <div className="flex gap-2 pt-2 mt-auto">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/formulas/${formula.id}/edit`}>
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
                      Tem certeza de que deseja excluir a fórmula “{formula.name}”?
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}