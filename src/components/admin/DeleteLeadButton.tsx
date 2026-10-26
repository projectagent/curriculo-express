import React, { useState } from 'react';
import { Lead } from '../../types/lead';
import { TrashIcon } from '../common/Icons';

interface DeleteLeadButtonProps {
  lead: Lead;
  onDelete: (id: string) => Promise<boolean>;
}

export const DeleteLeadButton: React.FC<DeleteLeadButtonProps> = ({ lead, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm('Tem certeza que deseja excluir permanentemente este lead?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(lead.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      title={`Excluir lead ${lead.name}`}
      aria-label={`Excluir lead ${lead.name}`}
      className="inline-flex items-center justify-center p-2 rounded-lg text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-500 shadow-2xs disabled:opacity-50"
    >
      <TrashIcon className={`w-3.5 h-3.5 text-rose-600 ${isDeleting ? 'animate-pulse' : ''}`} />
    </button>
  );
};
