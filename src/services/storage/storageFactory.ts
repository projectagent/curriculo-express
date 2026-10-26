import { ILeadsRepository } from './ILeadsRepository';
import { LocalStorageRepository } from './LocalStorageRepository';

let repositoryInstance: ILeadsRepository | null = null;

export function getLeadsRepository(): ILeadsRepository {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  repositoryInstance = new LocalStorageRepository();
  return repositoryInstance;
}

export const getStorageRepository = getLeadsRepository;

export function resetStorageRepository(): void {
  repositoryInstance = null;
}

export function setRepositoryInstanceForTesting(repo: ILeadsRepository | null): void {
  repositoryInstance = repo;
}

export const setStorageRepositoryForTesting = setRepositoryInstanceForTesting;

export function hasStorageRepositoryOverride(): boolean {
  return repositoryInstance !== null;
}
