import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
}) : null;

export const isOpenAIConfigured = () => {
  return openai !== null;
};

// AI-powered features
export const aiFeatures = {
  // Summarize interaction notes
  summarizeNotes: async (notes) => {
    if (!openai) return notes;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes customer interaction notes. Keep summaries concise and professional."
          },
          {
            role: "user",
            content: `Please summarize these interaction notes: ${notes}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });
      
      return response.choices[0]?.message?.content || notes;
    } catch (error) {
      console.error('Error summarizing notes:', error);
      return notes;
    }
  },

  // Generate follow-up message suggestions
  generateFollowUpMessage: async (leadName, lastInteraction, dealStage) => {
    if (!openai) return null;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a sales assistant that generates professional follow-up messages for CRM leads. Keep messages personalized, concise, and action-oriented."
          },
          {
            role: "user",
            content: `Generate a follow-up message for ${leadName}. Last interaction: ${lastInteraction}. Current deal stage: ${dealStage}`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });
      
      return response.choices[0]?.message?.content;
    } catch (error) {
      console.error('Error generating follow-up message:', error);
      return null;
    }
  },

  // Suggest deal stage based on interaction
  suggestDealStage: async (currentStage, recentInteractions) => {
    if (!openai) return currentStage;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a sales pipeline assistant. Based on recent interactions, suggest the most appropriate deal stage from: lead, qualified, proposal, negotiation, closed-won, closed-lost"
          },
          {
            role: "user",
            content: `Current stage: ${currentStage}. Recent interactions: ${recentInteractions.join(', ')}`
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      });
      
      const suggestion = response.choices[0]?.message?.content?.toLowerCase();
      const validStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
      
      return validStages.find(stage => suggestion?.includes(stage)) || currentStage;
    } catch (error) {
      console.error('Error suggesting deal stage:', error);
      return currentStage;
    }
  }
};
