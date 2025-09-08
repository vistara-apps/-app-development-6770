import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCRM } from '../context/CRMContext';
import { aiFeatures } from '../lib/openai';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Sparkles,
  X,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const InteractionLogger = ({ 
  isOpen, 
  onClose, 
  leadId = null, 
  dealId = null, 
  customerId = null 
}) => {
  const { addInteraction, leads, deals, customers } = useCRM();
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      type: 'email',
      notes: '',
      leadId: leadId,
      dealId: dealId,
      customerId: customerId
    }
  });

  const watchedType = watch('type');
  const watchedNotes = watch('notes');

  const interactionTypes = [
    { id: 'email', label: 'Email', icon: Mail, color: 'text-blue-400' },
    { id: 'call', label: 'Phone Call', icon: Phone, color: 'text-green-400' },
    { id: 'meeting', label: 'Meeting', icon: Calendar, color: 'text-purple-400' },
    { id: 'message', label: 'Message', icon: MessageSquare, color: 'text-yellow-400' },
    { id: 'note', label: 'Note', icon: FileText, color: 'text-gray-400' }
  ];

  const handleAiSummarize = async () => {
    if (!watchedNotes.trim()) {
      toast.error('Please enter some notes first');
      return;
    }

    setIsAiSummarizing(true);
    try {
      const summary = await aiFeatures.summarizeNotes(watchedNotes);
      setValue('notes', summary);
      toast.success('Notes summarized with AI');
    } catch (error) {
      console.error('AI summarization failed:', error);
      toast.error('AI summarization failed');
    } finally {
      setIsAiSummarizing(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const interaction = await addInteraction({
        ...data,
        leadId: data.leadId || null,
        dealId: data.dealId || null,
        customerId: data.customerId || null
      });

      if (interaction) {
        toast.success('Interaction logged successfully');
        reset();
        onClose();
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
      toast.error('Failed to log interaction');
    }
  };

  const getEntityName = () => {
    if (leadId) {
      const lead = leads.find(l => l.leadId === leadId);
      return lead ? `Lead: ${lead.name}` : 'Unknown Lead';
    }
    if (dealId) {
      const deal = deals.find(d => d.dealId === dealId);
      return deal ? `Deal: ${deal.name}` : 'Unknown Deal';
    }
    if (customerId) {
      const customer = customers.find(c => c.customerId === customerId);
      return customer ? `Customer: ${customer.name}` : 'Unknown Customer';
    }
    return 'General Interaction';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-surface rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-dark-text">Log Interaction</h2>
            <p className="text-gray-400 text-sm">{getEntityName()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-dark-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Interaction Type */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-3">
              Interaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {interactionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      watchedType === type.id
                        ? 'border-accent bg-dark-accent/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.id}
                      {...register('type', { required: 'Please select an interaction type' })}
                      className="sr-only"
                    />
                    <Icon size={16} className={`mr-2 ${type.color}`} />
                    <span className="text-sm text-dark-text">{type.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Entity Selection (if not pre-selected) */}
          {!leadId && !dealId && !customerId && (
            <div className="grid grid-cols-1 gap-4">
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
                  Related Deal
                </label>
                <select
                  {...register('dealId')}
                  className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
                >
                  <option value="">Select a deal (optional)</option>
                  {deals.map(deal => (
                    <option key={deal.dealId} value={deal.dealId}>
                      {deal.name} - ${deal.value?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Related Customer
                </label>
                <select
                  {...register('customerId')}
                  className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
                >
                  <option value="">Select a customer (optional)</option>
                  {customers.map(customer => (
                    <option key={customer.customerId} value={customer.customerId}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-text">
                Notes
              </label>
              <button
                type="button"
                onClick={handleAiSummarize}
                disabled={isAiSummarizing || !watchedNotes.trim()}
                className="flex items-center text-xs text-accent hover:text-accent/80 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <Sparkles size={12} className="mr-1" />
                {isAiSummarizing ? 'Summarizing...' : 'AI Summarize'}
              </button>
            </div>
            <textarea
              {...register('notes', { 
                required: 'Please enter interaction notes',
                minLength: { value: 10, message: 'Notes must be at least 10 characters' }
              })}
              rows={4}
              placeholder="Describe what happened during this interaction..."
              className="w-full bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text placeholder-gray-500 focus:border-accent focus:outline-none resize-none"
            />
            {errors.notes && (
              <p className="text-red-400 text-sm mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center"
            >
              <Send size={16} className="mr-2" />
              Log Interaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InteractionLogger;
