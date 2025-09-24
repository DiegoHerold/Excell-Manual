import { FormulaDB } from '@/lib/database';

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
    name: 'ARRED',
    description: 'Arredonda um número para um número especificado de dígitos',
    formula: '=ARRED(A1;2)',
    videoUrl: '',
    category: 'Arredondamento'
  },
  {
    name: 'CONT.SE',
    description: 'Conta o número de células que atendem a um critério',
    formula: '=CONT.SE(A1:A10;">10")',
    videoUrl: '',
    category: 'Estatística'
  }
];

export function seedDatabase() {
  console.log('Inserindo dados de exemplo...');
  
  sampleFormulas.forEach(formula => {
    try {
      FormulaDB.create(formula);
      console.log(`✓ Fórmula "${formula.name}" inserida`);
    } catch (error) {
      console.log(`✗ Erro ao inserir fórmula "${formula.name}":`, error);
    }
  });
  
  console.log('Dados de exemplo inseridos com sucesso!');
}