import React from 'react';
import { useCRM } from '../context/CRMContext';
import { Mail, Phone, MessageCircle } from 'lucide-react';

const RecentActivity = () => {
  const { interactions } = useCRM();

  const getIcon = (type) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'call':
        return Phone;
      default:
        return MessageCircle;
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-dark-text mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {interactions.slice(0, 5).map((interaction) => {
          const Icon = getIcon(interaction.type);
          return (
            <div key={interaction.id} className="flex items-start space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Icon size={16} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-dark-text">{interaction.notes}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(interaction.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;