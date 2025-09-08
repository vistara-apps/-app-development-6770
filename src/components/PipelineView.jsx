import React from 'react';
import { useCRM } from '../context/CRMContext';
import DealCard from './DealCard';

const PipelineView = () => {
  const { deals, dealStages, updateDeal } = useCRM();

  const handleDragStart = (e, dealId) => {
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStage) => {
    e.preventDefault();
    const dealId = parseInt(e.dataTransfer.getData('text/plain'));
    updateDeal(dealId, { stage: newStage });
  };

  const getDealsForStage = (stageId) => {
    return deals.filter(deal => deal.stage === stageId);
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-dark-text mb-4">Sales Pipeline</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
        {dealStages.map((stage) => (
          <div
            key={stage.id}
            className="min-w-64 bg-dark-card rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-dark-text">{stage.name}</h3>
              <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                {getDealsForStage(stage.id).length}
              </span>
            </div>
            <div className="space-y-2">
              {getDealsForStage(stage.id).map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PipelineView;