'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Category, Formula } from '@/lib/database';
import Link from 'next/link';

interface EditFormulaPageProps {
  params: {
    id: string;
  };
}

export default function EditFormulaPage({ params }: EditFormulaPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formula: '',
    videoUrl: '',
    categoryIds: [] as number[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formulaId = useMemo(() => params.id, [params.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchCategories(), fetchFormula()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulaId]);

  const fetchCategories = async () => {
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
  };

  const fetchFormula = async () => {
    try {
      const response = await fetch(`/api/formulas/${formulaId}`);
      if (response.ok) {
        const data: Formula = await response.json();
        setFormData({
          name: data.name,
          description: data.description,
          formula: data.formula,
          videoUrl: data.videoUrl || '',
          categoryIds: data.categoryIds ?? [],
        });
      } else if (response.status === 404) {
        toast({
          title: 'Fórmula não encontrada',
          description: 'A fórmula que você tentou editar não existe.',
          variant: 'destructive',
        });
        router.push('/admin/formulas');
      }
    } catch (error) {
      console.error('Error fetching formula:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));

    if (errors.categoryIds) {
      setErrors((prev) => ({ ...prev, categoryIds: '' }));
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

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/formulas/${formulaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Fórmula atualizada!',
          description: 'As alterações foram salvas com sucesso.',
        });
        router.push('/admin/formulas');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erro ao atualizar fórmula',
          description: errorData.error || 'Não foi possível atualizar a fórmula.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating formula:', error);
      toast({
        title: 'Erro ao atualizar fórmula',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da fórmula...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/formulas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Fórmula</h1>
          <p className="text-gray-600 mt-2">Atualize as informações da fórmula selecionada</p>
        </motion.div>

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
                      onChange={(event) => handleInputChange('name', event.target.value)}
                      placeholder="Ex: SOMA, PROCV, SE..."
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Categorias *</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-3 text-sm text-gray-700">
                          <Checkbox
                            checked={formData.categoryIds.includes(category.id!)}
                            onCheckedChange={() => handleCategoryToggle(category.id!)}
                          />
                          <span>{category.name}</span>
                        </label>
                      ))}
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
                    onChange={(event) => handleInputChange('description', event.target.value)}
                    placeholder="Explique o que esta fórmula faz e em quais situações usar."
                    rows={4}
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
                    onChange={(event) => handleInputChange('formula', event.target.value)}
                    placeholder="Digite a fórmula completa, incluindo parâmetros."
                    rows={3}
                    className={`font-mono ${errors.formula ? 'border-red-500' : ''}`}
                  />
                  {errors.formula && (
                    <p className="text-sm text-red-600">{errors.formula}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL de Vídeo (opcional)</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(event) => handleInputChange('videoUrl', event.target.value)}
                    placeholder="https://..."
                    className={errors.videoUrl ? 'border-red-500' : ''}
                  />
                  {errors.videoUrl && (
                    <p className="text-sm text-red-600">{errors.videoUrl}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar alterações
                      </>
                    )}
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
