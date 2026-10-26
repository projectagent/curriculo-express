import { Lead, CreateLeadDTO, LeadStatus } from '../../types/lead';

export interface ILeadsRepository {
  readonly mode: 'local-storage';
  getAll(): Promise<Lead[]>;
  getById(id: string): Promise<Lead | null>;
  create(dto: CreateLeadDTO): Promise<Lead>;
  updateStatus(id: string, status: LeadStatus): Promise<Lead>;
  delete(id: string): Promise<boolean>;
}
