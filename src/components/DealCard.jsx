import React from 'react';
import { useCRM } from '../context/CRMContext';
import { Calendar, DollarSign } from 'lucide-react';

const DealCard = ({ deal, onDragStart }) => {
  const { leads } = useCRM();
  const lead = leads.find(l => l.id === deal.leadId);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="bg-dark-surface border border-gray-600 rounded-lg p-3 cursor-move hover:border-blue-500 transition-colors"
    >
      <h4 className="font-medium text-dark-text text-sm mb-2">{deal.name}</h4>
      {lead && (
        <p className="text-xs text-gray-400 mb-2">{lead.name}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <DollarSign size={12} />
          <span>${deal.value.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar size={12} />
          <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default DealCard;