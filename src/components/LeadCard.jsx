import React from 'react';
import { useCRM } from '../context/CRMContext';
import { Mail, Phone, Calendar, ArrowRight } from 'lucide-react';

const LeadCard = ({ lead }) => {
  const { addDeal } = useCRM();

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500';
      case 'contacted':
        return 'bg-yellow-500';
      case 'qualified':
        return 'bg-green-500';
      case 'unqualified':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const convertToDeal = () => {
    addDeal({
      leadId: lead.id,
      name: `Deal with ${lead.name}`,
      value: 0,
      stage: 'qualified',
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  return (
    <div className="card hover:border-blue-500 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-dark-text">{lead.name}</h3>
          <p className="text-sm text-gray-400">{lead.source}</p>
        </div>
        <span className={`px-2 py-1 text-xs text-white rounded-full ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Mail size={16} />
          <span>{lead.email}</span>
        </div>
        {lead.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Phone size={16} />
            <span>{lead.phone}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Calendar size={16} />
          <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <button
        onClick={convertToDeal}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors text-sm"
      >
        <span>Convert to Deal</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default LeadCard;