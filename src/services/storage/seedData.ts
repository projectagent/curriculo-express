import { Lead } from '../../types/lead';

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead-001',
    name: 'Mariana Souza',
    link: 'https://linkedin.com/in/mariana-souza-dev',
    areaRole: 'Desenvolvedora Frontend React Júnior',
    status: 'Novo',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: 'lead-002',
    name: 'Lucas Ferreira',
    link: 'https://linkedin.com/in/lucas-ferreira-qa',
    areaRole: 'Analista de QA / Automação Cypress',
    status: 'Aguardando Pagamento',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
  },
  {
    id: 'lead-003',
    name: 'Beatriz Lima',
    link: 'https://drive.google.com/file/d/beatriz-cv/view',
    areaRole: 'Cientista de Dados / Machine Learning',
    status: 'Revisando (IA)',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
  },
  {
    id: 'lead-004',
    name: 'Gabriel Rocha',
    link: 'https://linkedin.com/in/gabriel-rocha-techlead',
    areaRole: 'Engenheiro de Software Backend Node/Java',
    status: 'Entregue',
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
  },
  {
    id: 'lead-005',
    name: 'Camila Duarte',
    link: 'https://linkedin.com/in/camila-duarte-ux',
    areaRole: 'Product Designer / UX UI Senior',
    status: 'Novo',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
  },
];

export const INITIAL_SEEDED_LEADS = SEED_LEADS;
