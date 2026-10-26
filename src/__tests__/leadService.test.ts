import { describe, it, expect } from 'vitest';
import { calculateAdminStats, filterAndSortLeads } from '../services/leadService';
import { Lead } from '../types/lead';

describe('leadService', () => {
  const sampleLeads: Lead[] = [
    {
      id: '1',
      name: 'Mariana Souza',
      link: 'https://linkedin.com/in/mariana',
      areaRole: 'Frontend Developer',
      status: 'Novo',
      createdAt: '2026-10-26T10:00:00.000Z',
    },
    {
      id: '2',
      name: 'Lucas Ferreira',
      link: 'https://linkedin.com/in/lucas',
      areaRole: 'QA Engineer',
      status: 'Aguardando Pagamento',
      createdAt: '2026-10-26T09:00:00.000Z',
    },
    {
      id: '3',
      name: 'Carla Alencar',
      link: 'https://linkedin.com/in/carla',
      areaRole: 'Data Scientist',
      status: 'Revisando (IA)',
      createdAt: '2026-10-26T08:00:00.000Z',
    },
    {
      id: '4',
      name: 'Rodrigo Ramos',
      link: 'https://linkedin.com/in/rodrigo',
      areaRole: 'Tech Lead Backend',
      status: 'Entregue',
      createdAt: '2026-10-26T07:00:00.000Z',
    },
  ];

  it('calculates admin statistics accurately', () => {
    const stats = calculateAdminStats(sampleLeads);
    expect(stats.total).toBe(4);
    expect(stats.novos).toBe(1);
    expect(stats.aguardandoPagamento).toBe(1);
    expect(stats.revisandoIA).toBe(1);
    expect(stats.entregues).toBe(1);
  });

  it('filters leads by search query matching name, role, or link', () => {
    const resultName = filterAndSortLeads(sampleLeads, { searchQuery: 'Mariana' });
    expect(resultName.length).toBe(1);
    expect(resultName[0].name).toBe('Mariana Souza');

    const resultRole = filterAndSortLeads(sampleLeads, { searchQuery: 'qa' });
    expect(resultRole.length).toBe(1);
    expect(resultRole[0].name).toBe('Lucas Ferreira');
  });

  it('filters leads by status', () => {
    const resultStatus = filterAndSortLeads(sampleLeads, { status: 'Entregue' });
    expect(resultStatus.length).toBe(1);
    expect(resultStatus[0].name).toBe('Rodrigo Ramos');
  });

  it('sorts leads by createdAt descending and name ascending', () => {
    const sortedDesc = filterAndSortLeads(sampleLeads, { sortBy: 'createdAt_desc' });
    expect(sortedDesc[0].name).toBe('Mariana Souza'); // newest

    const sortedName = filterAndSortLeads(sampleLeads, { sortBy: 'name_asc' });
    expect(sortedName[0].name).toBe('Carla Alencar'); // alphabetical
  });
});
