import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useCRM } from '../context/CRMContext';
import { format } from 'date-fns';
import { DollarSign, Calendar, User, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

const DragDropPipeline = () => {
  const { deals, dealStages, updateDeal, loading } = useCRM();
  const [draggedItem, setDraggedItem] = useState(null);

  // Group deals by stage
  const dealsByStage = dealStages.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {});

  const handleDragStart = (start) => {
    const deal = deals.find(d => d.dealId === start.draggableId);
    setDraggedItem(deal);
  };

  const handleDragEnd = async (result) => {
    setDraggedItem(null);
    
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const dealId = draggableId;
    const newStage = destination.droppableId;

    try {
      await updateDeal(dealId, { stage: newStage });
      toast.success(`Deal moved to ${dealStages.find(s => s.id === newStage)?.name}`);
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast.error('Failed to update deal stage');
    }
  };

  const DealCard = ({ deal, index }) => (
    <Draggable draggableId={deal.dealId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-dark-card rounded-lg p-4 mb-3 border border-gray-600 transition-all duration-200 ${
            snapshot.isDragging 
              ? 'shadow-lg rotate-2 scale-105 border-accent' 
              : 'hover:border-gray-500'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-dark-text text-sm truncate flex-1">
              {deal.name}
            </h4>
            <button className="text-gray-400 hover:text-dark-text p-1">
              <MoreHorizontal size={14} />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-green-400 text-sm">
              <DollarSign size={14} className="mr-1" />
              <span className="font-medium">
                ${deal.value?.toLocaleString() || '0'}
              </span>
            </div>
            
            {deal.expectedCloseDate && (
              <div className="flex items-center text-gray-400 text-xs">
                <Calendar size={12} className="mr-1" />
                <span>
                  {format(new Date(deal.expectedCloseDate), 'MMM dd')}
                </span>
              </div>
            )}
            
            <div className="flex items-center text-gray-400 text-xs">
              <User size={12} className="mr-1" />
              <span className="truncate">
                Lead #{deal.leadId?.toString().slice(-4) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  const StageColumn = ({ stage }) => {
    const stageDeals = dealsByStage[stage.id] || [];
    const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    return (
      <div className="flex-1 min-w-0 mx-2">
        <div className="bg-dark-surface rounded-lg p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stage.color} mr-2`} />
              <h3 className="font-semibold text-dark-text text-sm">
                {stage.name}
              </h3>
              <span className="ml-2 bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                {stageDeals.length}
              </span>
            </div>
          </div>
          
          {stageValue > 0 && (
            <div className="mb-4 text-xs text-gray-400">
              Total: ${stageValue.toLocaleString()}
            </div>
          )}

          <Droppable droppableId={stage.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[200px] transition-colors duration-200 ${
                  snapshot.isDraggingOver 
                    ? 'bg-dark-accent/20 rounded-lg' 
                    : ''
                }`}
              >
                {stageDeals.map((deal, index) => (
                  <DealCard key={deal.dealId} deal={deal} index={index} />
                ))}
                {provided.placeholder}
                
                {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No deals in this stage
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="flex space-x-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1">
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="space-y-2">
                  <div className="h-20 bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-surface rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-dark-text">Sales Pipeline</h2>
          <p className="text-gray-400 text-sm">
            Drag deals between stages to update their status
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {deals.length} total deals
        </div>
      </div>

      <DragDropContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
          {dealStages.map(stage => (
            <StageColumn key={stage.id} stage={stage} />
          ))}
        </div>
      </DragDropContext>

      {draggedItem && (
        <div className="fixed bottom-4 right-4 bg-dark-card border border-accent rounded-lg p-3 shadow-lg z-50">
          <div className="text-sm text-dark-text">
            Moving: <span className="font-semibold">{draggedItem.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropPipeline;
