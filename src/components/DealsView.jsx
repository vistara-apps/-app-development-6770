import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import DragDropPipeline from './DragDropPipeline';
import InteractionLogger from './InteractionLogger';

const DealsView = () => {
  const { deals, dealStages, addDeal, leads, loading } = useCRM();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInteractionLogger, setShowInteractionLogger] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      value: '',
      stage: 'lead',
      expectedCloseDate: '',
      leadId: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      const dealData = {
        ...data,
        value: parseFloat(data.value) || 0,
        leadId: data.leadId || null
      };
      
      const newDeal = await addDeal(dealData);
      if (newDeal) {
        reset();
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding deal:', error);
    }
  };

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const totalDeals = deals.length;
  const activeDeals = deals.filter(deal => !['closed-won', 'closed-lost'].includes(deal.stage)).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Deals Pipeline</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>Total: ${totalValue.toLocaleString()}</span>
            <span>•</span>
            <span>{activeDeals} active of {totalDeals} deals</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowInteractionLogger(true)}
            className="flex items-center px-4 py-2 bg-dark-surface border border-gray-600 text-dark-text rounded-lg hover:border-gray-500 transition-colors"
          >
            Log Interaction
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Drag & Drop Pipeline */}
      <DragDropPipeline />

      {/* Add Deal Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-surface rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-text">Add New Deal</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-dark-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Deal Name *
                </label>
                <input
                  type="text"
                  {...register('name', { 
                    required: 'Deal name is required',
                    minLength: { value: 2, message: 'Deal name must be at least 2 characters' }
                  })}
                  className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
                  placeholder="Enter deal name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Value ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('value', { 
                    required: 'Deal value is required',
                    min: { value: 0, message: 'Value must be positive' }
                  })}
                  className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
                  placeholder="0.00"
                />
                {errors.value && (
                  <p className="text-red-400 text-sm mt-1">{errors.value.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Stage
                </label>
                <select
                  {...register('stage')}
                  className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
                >
                  {dealStages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Related Lead
                </label>
                <select
                  {...register('leadId')}
                  className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
                >
                  <option value="">Select a lead (optional)</option>
                  {leads.map(lead => (
                    <option key={lead.leadId} value={lead.leadId}>
                      {lead.name} - {lead.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  {...register('expectedCloseDate')}
                  className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interaction Logger */}
      <InteractionLogger
        isOpen={showInteractionLogger}
        onClose={() => setShowInteractionLogger(false)}
        dealId={selectedDealId}
      />
    </div>
  );
};

export default DealsView;
