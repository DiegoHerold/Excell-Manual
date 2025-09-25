import { FormulaDB, CategoryDB } from '@/lib/database';

const sampleCategories = [
  { name: 'Matemática', description: 'Funções para cálculos matemáticos' },
  { name: 'Texto', description: 'Manipulação e formatação de texto' },
  { name: 'Data e Hora', description: 'Trabalhar com datas e horários' },
  { name: 'Lógica', description: 'Funções condicionais e lógicas' },
  { name: 'Pesquisa', description: 'Buscar e localizar dados' },
  { name: 'Estatística', description: 'Análise estatística de dados' },
  { name: 'Financeira', description: 'Cálculos financeiros' },
  { name: 'Arredondamento', description: 'Arredondar números' },
];

const sampleFormulas = [
  {
    name: 'SOMA',
    description: 'Soma todos os valores em um intervalo de células',
    formula: '=SOMA(A1:A10)',
    videoUrl: 'https://www.youtube.com/watch?v=FXjLWYu8F9k',
    categoryIds: [1] // Matemática
  },
  {
    name: 'MÉDIA',
    description: 'Calcula a média aritmética de um conjunto de números',
    formula: '=MÉDIA(B1:B20)',
    videoUrl: '',
    categoryIds: [1, 6] // Matemática, Estatística
  },
  {
    name: 'SE',
    description: 'Executa um teste lógico e retorna um valor se verdadeiro e outro se falso',
    formula: '=SE(A1>10;"Grande";"Pequeno")',
    videoUrl: 'https://www.youtube.com/watch?v=_Ir6ne2lG7c',
    categoryIds: [4] // Lógica
  },
  {
    name: 'PROCV',
    description: 'Procura um valor na primeira coluna e retorna um valor na mesma linha',
    formula: '=PROCV(A2;Tabela!A:D;3;FALSO)',
    videoUrl: '',
    categoryIds: [5] // Pesquisa
  },
  {
    name: 'CONCATENAR',
    description: 'Junta duas ou mais cadeias de texto em uma única cadeia',
    formula: '=CONCATENAR(A1;" ";B1)',
    videoUrl: '',
    categoryIds: [2] // Texto
  },
  {
    name: 'HOJE',
    description: 'Retorna a data de hoje',
    formula: '=HOJE()',
    videoUrl: '',
    categoryIds: [3] // Data e Hora
  },
  {
    name: 'ARRED',
    description: 'Arredonda um número para um número especificado de dígitos',
    formula: '=ARRED(A1;2)',
    videoUrl: '',
    categoryIds: [1, 8] // Matemática, Arredondamento
  },
  {
    name: 'CONT.SE',
    description: 'Conta o número de células que atendem a um critério',
    formula: '=CONT.SE(A1:A10;">10")',
    videoUrl: '',
    categoryIds: [6] // Estatística
  }
];

export function seedDatabase() {
  console.log('Inserindo dados de exemplo...');
  
  // Create categories first
  const createdCategories: { [key: string]: number } = {};
  sampleCategories.forEach(categoryData => {
    try {
      const category = CategoryDB.create(categoryData);
      createdCategories[categoryData.name] = category.id!;
      console.log(`✓ Categoria "${categoryData.name}" inserida com ID ${category.id}`);
    } catch (error) {
      console.log(`✗ Erro ao inserir categoria "${categoryData.name}":`, error);
    }
  });
  
  // Create formulas with proper category IDs
  sampleFormulas.forEach(formulaData => {
    try {
      FormulaDB.create(formulaData);
      console.log(`✓ Fórmula "${formulaData.name}" inserida`);
    } catch (error) {
      console.log(`✗ Erro ao inserir fórmula "${formulaData.name}":`, error);
    }
  });
  
  console.log('Dados de exemplo inseridos com sucesso!');
}