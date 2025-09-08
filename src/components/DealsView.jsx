import React from 'react';
import { useCRM } from '../context/CRMContext';
import PipelineView from './PipelineView';

const DealsView = () => {
  const { deals } = useCRM();

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const activeDeals = deals.filter(deal => !['closed-won', 'closed-lost'].includes(deal.stage));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Deals</h1>
          <p className="text-gray-400">Manage your sales pipeline</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Total Pipeline Value</p>
          <p className="text-2xl font-bold text-dark-text">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-400">Active Deals</p>
          <p className="text-2xl font-bold text-dark-text">{activeDeals.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-400">Won Deals</p>
          <p className="text-2xl font-bold text-green-400">
            {deals.filter(d => d.stage === 'closed-won').length}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-400">Lost Deals</p>
          <p className="text-2xl font-bold text-red-400">
            {deals.filter(d => d.stage === 'closed-lost').length}
          </p>
        </div>
      </div>

      <PipelineView />
    </div>
  );
};

export default DealsView;