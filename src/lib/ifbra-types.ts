export type ScoreValue = 25 | 50 | 75 | 100;
export type ScoreOrigin = 'manual' | 'extracted' | 'edited';
export type DisabilityType = 'visual' | 'auditiva' | 'intelectual' | 'motora';
export type AssessmentType = 'social' | 'medical';

export interface ScoreEntry {
  score: ScoreValue;
  origin: ScoreOrigin;
}

export interface ItemDefinition {
  id: string;
  name: string;
  domainId: number;
}

export interface DomainDefinition {
  id: number;
  name: string;
  shortName: string;
}

export const DOMAINS: DomainDefinition[] = [
  { id: 1, name: 'Sensorial', shortName: 'Sensorial' },
  { id: 2, name: 'Comunicação', shortName: 'Comunicação' },
  { id: 3, name: 'Mobilidade', shortName: 'Mobilidade' },
  { id: 4, name: 'Cuidados Pessoais', shortName: 'Cuid. Pessoais' },
  { id: 5, name: 'Vida Doméstica', shortName: 'Vida Doméstica' },
  { id: 6, name: 'Educação, Trabalho e Vida Econômica', shortName: 'Educ/Trab/Econ' },
  { id: 7, name: 'Socialização e Vida Comunitária', shortName: 'Socialização' },
];

export const ITEMS: ItemDefinition[] = [
  { id: '1.1', name: 'Observar', domainId: 1 },
  { id: '1.2', name: 'Ouvir', domainId: 1 },
  { id: '2.1', name: 'Comunicar-se / Recepção de mensagens', domainId: 2 },
  { id: '2.2', name: 'Comunicar-se / Produção de mensagens', domainId: 2 },
  { id: '2.3', name: 'Conversar', domainId: 2 },
  { id: '2.4', name: 'Discutir', domainId: 2 },
  { id: '2.5', name: 'Utilização de dispositivos de comunicação à distância', domainId: 2 },
  { id: '3.1', name: 'Mudar e manter a posição do corpo', domainId: 3 },
  { id: '3.2', name: 'Alcançar, transportar e mover objetos', domainId: 3 },
  { id: '3.3', name: 'Movimentos finos da mão', domainId: 3 },
  { id: '3.4', name: 'Deslocar-se dentro de casa', domainId: 3 },
  { id: '3.5', name: 'Deslocar-se dentro de edifícios que não a própria casa', domainId: 3 },
  { id: '3.6', name: 'Deslocar-se fora de sua casa e de outros edifícios', domainId: 3 },
  { id: '3.7', name: 'Utilizar transporte coletivo', domainId: 3 },
  { id: '3.8', name: 'Utilizar transporte individual como passageiro', domainId: 3 },
  { id: '4.1', name: 'Lavar-se', domainId: 4 },
  { id: '4.2', name: 'Cuidar de partes do corpo', domainId: 4 },
  { id: '4.3', name: 'Regulação da micção', domainId: 4 },
  { id: '4.4', name: 'Regulação da defecação', domainId: 4 },
  { id: '4.5', name: 'Vestir-se', domainId: 4 },
  { id: '4.6', name: 'Comer', domainId: 4 },
  { id: '4.7', name: 'Beber', domainId: 4 },
  { id: '4.8', name: 'Capacidade de identificar agravos à saúde', domainId: 4 },
  { id: '5.1', name: 'Preparar refeições tipo lanches', domainId: 5 },
  { id: '5.2', name: 'Cozinhar', domainId: 5 },
  { id: '5.3', name: 'Realizar tarefas domésticas', domainId: 5 },
  { id: '5.4', name: 'Manutenção e uso de objetos pessoais e utensílios', domainId: 5 },
  { id: '5.5', name: 'Cuidar dos outros', domainId: 5 },
  { id: '6.1', name: 'Educação', domainId: 6 },
  { id: '6.2', name: 'Qualificação profissional', domainId: 6 },
  { id: '6.3', name: 'Trabalho remunerado', domainId: 6 },
  { id: '6.4', name: 'Fazer compras e contratar serviços', domainId: 6 },
  { id: '6.5', name: 'Administração de recursos econômicos pessoais', domainId: 6 },
  { id: '7.1', name: 'Regular o comportamento nas interações', domainId: 7 },
  { id: '7.2', name: 'Interagir de acordo com as regras sociais', domainId: 7 },
  { id: '7.3', name: 'Relacionamentos com estranhos', domainId: 7 },
  { id: '7.4', name: 'Relacionamentos familiares e com pessoas familiares', domainId: 7 },
  { id: '7.5', name: 'Relacionamentos íntimos', domainId: 7 },
  { id: '7.6', name: 'Socialização', domainId: 7 },
  { id: '7.7', name: 'Fazer as próprias escolhas', domainId: 7 },
  { id: '7.8', name: 'Vida Política e Cidadania', domainId: 7 },
];

export const DISABILITY_CONFIG: Record<DisabilityType, {
  label: string;
  sensitiveDomains: number[];
  emblematicQuestion: string;
  scoreConditionText: string;
}> = {
  visual: {
    label: 'Deficiência Visual',
    sensitiveDomains: [3, 5],
    emblematicQuestion: 'A pessoa já não enxergava ao nascer.',
    scoreConditionText: 'Houve pontuação 25 ou 50 em alguma atividade do Domínio Mobilidade ou Vida Doméstica; OU Houve pontuação 75 em todas as atividades dos Domínios Mobilidade ou Vida Doméstica.',
  },
  auditiva: {
    label: 'Deficiência Auditiva',
    sensitiveDomains: [2, 7],
    emblematicQuestion: 'A surdez ocorreu antes dos 6 anos.',
    scoreConditionText: 'Houve pontuação 25 ou 50 em alguma atividade do Domínio Comunicação ou Socialização e Vida Comunitária; OU Houve pontuação 75 em todas as atividades dos Domínios Comunicação ou Socialização e Vida Comunitária.',
  },
  intelectual: {
    label: 'Deficiência Intelectual (Cognitiva e Mental)',
    sensitiveDomains: [5, 7],
    emblematicQuestion: 'Não pode ficar sozinho em segurança.',
    scoreConditionText: 'Houve pontuação 25 ou 50 em alguma atividade do Domínio Vida Doméstica ou Socialização e Vida Comunitária; OU Houve pontuação 75 em todas as atividades dos Domínios Vida Doméstica ou Socialização e Vida Comunitária.',
  },
  motora: {
    label: 'Deficiência Motora',
    sensitiveDomains: [3, 4],
    emblematicQuestion: 'Desloca-se exclusivamente em cadeira de rodas.',
    scoreConditionText: 'Houve pontuação 25 ou 50 em alguma atividade do Domínio Mobilidade ou Cuidados Pessoais; OU Houve pontuação 75 em todas as atividades dos Domínios Mobilidade ou Cuidados Pessoais.',
  },
};

export interface ClassificationRanges {
  grave: { min: number; max: number };
  moderada: { min: number; max: number };
  leve: { min: number; max: number };
  insuficiente: { min: number; max: number };
}

export const DEFAULT_RANGES: ClassificationRanges = {
  grave: { min: 0, max: 5739 },
  moderada: { min: 5740, max: 6354 },
  leve: { min: 6355, max: 7584 },
  insuficiente: { min: 7585, max: 8200 },
};

export interface DisabilityFlags {
  emblematic: boolean;
  auxilio: boolean;
}

export interface ScoreDistribution {
  count25: number;
  count50: number;
  count75: number;
  count100: number;
  points25: number;
  points50: number;
  points75: number;
  points100: number;
  total: number;
}

export interface DomainAuditEntry {
  domainId: number;
  domainName: string;
  minScore: number;
  itemsChanged: Array<{ itemId: string; before: number; after: number }>;
}

export interface DisabilityAuditEntry {
  disability: DisabilityType;
  social: {
    scoreConditionDetected: boolean;
    emblematic: boolean;
    auxilio: boolean;
    fired: boolean;
    domainsAffected: DomainAuditEntry[];
  };
  medical: {
    scoreConditionDetected: boolean;
    emblematic: boolean;
    auxilio: boolean;
    fired: boolean;
    domainsAffected: DomainAuditEntry[];
  };
}

export interface AuditTrail {
  disabilities: DisabilityAuditEntry[];
  social: {
    original: ScoreDistribution;
    fuzzy: ScoreDistribution;
    domainTotals: Record<number, { original: number; fuzzy: number }>;
  };
  medical: {
    original: ScoreDistribution;
    fuzzy: ScoreDistribution;
    domainTotals: Record<number, { original: number; fuzzy: number }>;
  };
  combinedOriginal: number;
  combinedFuzzy: number;
  classificationOriginal: string;
  classificationFuzzy: string;
  itemOrigins: Record<string, { social: ScoreOrigin; medical: ScoreOrigin }>;
}

export interface CertificateHeader {
  processo: string;
  autor: string;
  reu: string;
  eventoSocial: string;
  eventoMedico: string;
  dataHora: string;
  tribunal: string;
  vara: string;
}

export const DEFAULT_HEADER: CertificateHeader = {
  processo: '',
  autor: '',
  reu: 'INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS',
  eventoSocial: '',
  eventoMedico: '',
  dataHora: new Date().toLocaleDateString('pt-BR'),
  tribunal: 'JUSTIÇA FEDERAL',
  vara: '',
};
