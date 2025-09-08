import React from 'react';
import { Mail, Calendar, Tag } from 'lucide-react';

const CustomerCard = ({ customer }) => {
  return (
    <div className="card hover:border-blue-500 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-dark-text">{customer.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
            <Mail size={16} />
            <span>{customer.email}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
        <Calendar size={16} />
        <span>Customer since {new Date(customer.createdAt).toLocaleDateString()}</span>
      </div>

      {customer.tags && customer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {customer.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center space-x-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs"
            >
              <Tag size={12} />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerCard;