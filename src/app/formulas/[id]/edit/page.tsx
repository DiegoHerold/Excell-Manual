'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Formula, Category } from '@/lib/database';
import Link from 'next/link';

interface EditFormulaPageProps {
  params: {
    id: string;
  };
}

export default function EditFormulaPage({ params }: EditFormulaPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formula: '',
    videoUrl: '',
    categoryIds: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
    fetchFormula();
  }, [params.id]);

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

  const fetchFormula = async () => {
    try {
      const response = await fetch(`/api/formulas/${params.id}`);
      if (response.ok) {
        const formula: Formula = await response.json();
        setFormData({
          name: formula.name,
          description: formula.description,
          formula: formula.formula,
          videoUrl: formula.videoUrl || '',
          categoryIds: formula.categoryIds || [],
        });
      } else {
        toast({
          title: "Erro",
          description: "Fórmula não encontrada.",
          variant: "destructive",
        });
        router.push('/');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a fórmula.",
        variant: "destructive",
      });
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
    
    if (errors.categoryIds) {
      setErrors(prev => ({ ...prev, categoryIds: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.formula.trim()) {
      newErrors.formula = 'Fórmula é obrigatória';
    }

    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = 'Selecione pelo menos uma categoria';
    }

    if (formData.videoUrl && !isValidUrl(formData.videoUrl)) {
      newErrors.videoUrl = 'URL do vídeo inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/formulas/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Fórmula atualizada!",
          description: "As alterações foram salvas com sucesso.",
        });
        router.push('/');
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro ao atualizar fórmula",
          description: errorData.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar fórmula",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando fórmula...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Fórmula</h1>
          <p className="text-gray-600 mt-2">Atualize as informações da fórmula</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Informações da Fórmula</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Fórmula *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: SOMA, PROCV, SE..."
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Categorias *</Label>
                    <div className={`border rounded-md p-3 space-y-2 ${errors.categoryIds ? 'border-red-500' : ''}`}>
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500">Carregando categorias...</p>
                      ) : (
                        categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={formData.categoryIds.includes(category.id!)}
                              onCheckedChange={() => handleCategoryToggle(category.id!)}
                            />
                            <Label 
                              htmlFor={`category-${category.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {category.name}
                              {category.description && (
                                <span className="text-gray-500 ml-1">- {category.description}</span>
                              )}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                    {errors.categoryIds && (
                      <p className="text-sm text-red-600">{errors.categoryIds}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva brevemente o que a fórmula faz..."
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formula">Fórmula *</Label>
                  <Textarea
                    id="formula"
                    value={formData.formula}
                    onChange={(e) => handleInputChange('formula', e.target.value)}
                    placeholder="=SOMA(A1:A10)"
                    rows={3}
                    className={`font-mono ${errors.formula ? 'border-red-500' : ''}`}
                  />
                  {errors.formula && (
                    <p className="text-sm text-red-600">{errors.formula}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL do Vídeo (opcional)</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={errors.videoUrl ? 'border-red-500' : ''}
                  />
                  {errors.videoUrl && (
                    <p className="text-sm text-red-600">{errors.videoUrl}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Cole aqui o link de um vídeo do YouTube ou outro serviço
                  </p>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                  
                  <Button asChild type="button" variant="outline">
                    <Link href="/">Cancelar</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}