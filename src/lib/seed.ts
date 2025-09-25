import { FormulaDB, CategoryDB, CardDB } from '@/lib/database';

const sampleCategories = [
  { name: 'Matemática', parentId: null },
  { name: 'Texto', parentId: null },
  { name: 'Data e Hora', parentId: null },
  { name: 'Lógica', parentId: null },
  { name: 'Pesquisa', parentId: null },
  { name: 'Estatística', parentId: null },
  { name: 'Financeira', parentId: null },
  { name: 'Engenharia', parentId: null },
  { name: 'Banco de Dados', parentId: null },
];

const sampleFormulas = [
  {
    name: 'SOMA',
    description: 'Soma todos os valores em um intervalo de células',
    formula: '=SOMA(A1:A10)',
    videoUrl: 'https://www.youtube.com/watch?v=FXjLWYu8F9k',
    category: 'Matemática'
  },
  {
    name: 'MÉDIA',
    description: 'Calcula a média aritmética de um conjunto de números',
    formula: '=MÉDIA(B1:B20)',
    videoUrl: '',
    category: 'Matemática'
  },
  {
    name: 'SE',
    description: 'Executa um teste lógico e retorna um valor se verdadeiro e outro se falso',
    formula: '=SE(A1>10;"Grande";"Pequeno")',
    videoUrl: 'https://www.youtube.com/watch?v=_Ir6ne2lG7c',
    category: 'Lógica'
  },
  {
    name: 'PROCV',
    description: 'Procura um valor na primeira coluna e retorna um valor na mesma linha',
    formula: '=PROCV(A2;Tabela!A:D;3;FALSO)',
    videoUrl: '',
    category: 'Pesquisa'
  },
  {
    name: 'CONCATENAR',
    description: 'Junta duas ou mais cadeias de texto em uma única cadeia',
    formula: '=CONCATENAR(A1;" ";B1)',
    videoUrl: '',
    category: 'Texto'
  },
  {
    name: 'HOJE',
    description: 'Retorna a data de hoje',
    formula: '=HOJE()',
    videoUrl: '',
    category: 'Data e Hora'
  },
  {
    name: 'CONT.SE',
    description: 'Conta o número de células que atendem a um critério',
    formula: '=CONT.SE(A1:A10;">10")',
    videoUrl: '',
    category: 'Estatística'
  }
];

const sampleCards = [
  {
    title: 'Como usar PROCV com múltiplos critérios',
    content: 'O PROCV é uma das funções mais úteis do Excel, mas pode ser limitado quando precisamos de múltiplos critérios. Neste card, vamos explorar técnicas avançadas para usar PROCV com múltiplos critérios usando funções auxiliares como ÍNDICE e CORRESP.',
  },
  {
    title: 'Formatação condicional avançada',
    content: 'A formatação condicional permite destacar dados importantes automaticamente. Aprenda a criar regras complexas usando fórmulas personalizadas para destacar tendências, valores duplicados e padrões específicos em seus dados.',
  },
  {
    title: 'Tabelas dinâmicas para análise de dados',
    content: 'As tabelas dinâmicas são uma ferramenta poderosa para resumir e analisar grandes volumes de dados. Este guia mostra como criar, personalizar e usar tabelas dinâmicas para extrair insights valiosos dos seus dados.',
  },
];

export function seedDatabase() {
  console.log('Inserindo dados de exemplo...');
  
  // Inserir categorias
  const categoryIds: number[] = [];
  sampleCategories.forEach(category => {
    try {
      const created = CategoryDB.create(category);
      categoryIds.push(created.id!);
      console.log(`✓ Categoria "${category.name}" inserida`);
    } catch (error) {
      console.log(`✗ Erro ao inserir categoria "${category.name}":`, error);
    }
  });

  // Inserir fórmulas (sistema antigo)
  sampleFormulas.forEach(formula => {
    try {
      FormulaDB.create(formula);
      console.log(`✓ Fórmula "${formula.name}" inserida`);
    } catch (error) {
      console.log(`✗ Erro ao inserir fórmula "${formula.name}":`, error);
    }
  });

  // Inserir cards
  sampleCards.forEach((card, index) => {
    try {
      // Vincular a algumas categorias aleatórias
      const randomCategories = categoryIds.slice(index, index + 2);
      CardDB.create(card, randomCategories);
      console.log(`✓ Card "${card.title}" inserido`);
    } catch (error) {
      console.log(`✗ Erro ao inserir card "${card.title}":`, error);
    }
  });
  
  console.log('Dados de exemplo inseridos com sucesso!');
}