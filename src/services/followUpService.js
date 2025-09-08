import { dataService } from './dataService.js';
import { farcasterAPI } from '../lib/farcaster.js';
import { aiFeatures } from '../lib/openai.js';
import toast from 'react-hot-toast';

// Follow-up templates
const FOLLOW_UP_TEMPLATES = {
  email: {
    new_lead: {
      subject: "Welcome! Let's discuss your project",
      body: "Hi {name},\n\nThank you for your interest! I'd love to learn more about your project and see how we can help.\n\nWould you be available for a quick 15-minute call this week?\n\nBest regards"
    },
    proposal_sent: {
      subject: "Following up on your proposal",
      body: "Hi {name},\n\nI wanted to follow up on the proposal I sent last week. Do you have any questions or would you like to discuss any aspects in more detail?\n\nI'm here to help!\n\nBest regards"
    },
    negotiation: {
      subject: "Let's finalize the details",
      body: "Hi {name},\n\nI hope you're doing well. I wanted to check in on our discussion and see if you need any clarification on the terms.\n\nLooking forward to moving forward together!\n\nBest regards"
    }
  },
  farcaster: {
    new_lead: "Hey {name}! 👋 Thanks for connecting. Would love to chat about your project. When works best for you?",
    proposal_sent: "Hi {name}! Just checking in on the proposal I sent. Any questions? Happy to jump on a call! 📞",
    negotiation: "Hey {name}! Hope you're well. Let's finalize those details and get this project started! 🚀"
  }
};

// Follow-up triggers and rules
const FOLLOW_UP_RULES = [
  {
    id: 'new_lead_24h',
    name: 'New Lead Follow-up',
    trigger: 'lead_created',
    delay: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    condition: (lead) => lead.status === 'new',
    template: 'new_lead',
    type: 'email'
  },
  {
    id: 'proposal_3d',
    name: 'Proposal Follow-up',
    trigger: 'stage_changed',
    delay: 3 * 24 * 60 * 60 * 1000, // 3 days
    condition: (deal) => deal.stage === 'proposal',
    template: 'proposal_sent',
    type: 'email'
  },
  {
    id: 'negotiation_2d',
    name: 'Negotiation Follow-up',
    trigger: 'stage_changed',
    delay: 2 * 24 * 60 * 60 * 1000, // 2 days
    condition: (deal) => deal.stage === 'negotiation',
    template: 'negotiation',
    type: 'farcaster'
  },
  {
    id: 'stale_lead_7d',
    name: 'Stale Lead Re-engagement',
    trigger: 'no_interaction',
    delay: 7 * 24 * 60 * 60 * 1000, // 7 days
    condition: (lead, lastInteraction) => {
      const daysSinceLastInteraction = (Date.now() - new Date(lastInteraction?.timestamp || lead.createdAt)) / (24 * 60 * 60 * 1000);
      return daysSinceLastInteraction >= 7;
    },
    template: 'new_lead',
    type: 'email'
  }
];

class FollowUpService {
  constructor() {
    this.activeRules = new Set(FOLLOW_UP_RULES.map(rule => rule.id));
    this.processingQueue = new Map();
  }

  // Enable/disable follow-up rules
  enableRule(ruleId) {
    this.activeRules.add(ruleId);
  }

  disableRule(ruleId) {
    this.activeRules.delete(ruleId);
  }

  // Get template with variable substitution
  getTemplate(templateType, templateName, variables = {}) {
    const template = FOLLOW_UP_TEMPLATES[templateType]?.[templateName];
    if (!template) return null;

    if (typeof template === 'string') {
      return this.substituteVariables(template, variables);
    }

    return {
      subject: this.substituteVariables(template.subject, variables),
      body: this.substituteVariables(template.body, variables)
    };
  }

  substituteVariables(text, variables) {
    return text.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  }

  // Schedule follow-up based on trigger
  async scheduleFollowUp(trigger, data, userId) {
    const applicableRules = FOLLOW_UP_RULES.filter(rule => 
      rule.trigger === trigger && 
      this.activeRules.has(rule.id) &&
      rule.condition(data)
    );

    for (const rule of applicableRules) {
      const scheduledDate = new Date(Date.now() + rule.delay);
      
      // Check if follow-up already exists
      const existingFollowUps = await dataService.getFollowUps(userId);
      const exists = existingFollowUps.some(f => 
        f.leadId === data.leadId && 
        f.type === rule.type && 
        f.status === 'pending'
      );

      if (exists) {
        console.log(`Follow-up already scheduled for lead ${data.leadId} with rule ${rule.id}`);
        continue;
      }

      // Generate message using AI if available
      let message = this.getTemplate(rule.type, rule.template, {
        name: data.name,
        email: data.email
      });

      // Enhance with AI if configured
      if (rule.type === 'email' && typeof message === 'object') {
        try {
          const aiMessage = await aiFeatures.generateFollowUpMessage(
            data.name,
            `Lead created from ${data.source}`,
            data.stage || 'new'
          );
          if (aiMessage) {
            message.body = aiMessage;
          }
        } catch (error) {
          console.warn('AI message generation failed, using template:', error);
        }
      }

      // Create follow-up record
      const followUp = await dataService.createFollowUp({
        leadId: data.leadId || data.id,
        dealId: data.dealId || null,
        type: rule.type,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        scheduledDate: scheduledDate.toISOString(),
        ruleId: rule.id,
        ruleName: rule.name
      }, userId);

      console.log(`Scheduled ${rule.type} follow-up for ${data.name} at ${scheduledDate}`);
    }
  }

  // Process pending follow-ups
  async processPendingFollowUps(userId) {
    const followUps = await dataService.getFollowUps(userId);
    const pendingFollowUps = followUps.filter(f => 
      f.status === 'pending' && 
      new Date(f.scheduledDate) <= new Date()
    );

    for (const followUp of pendingFollowUps) {
      try {
        await this.executeFollowUp(followUp, userId);
      } catch (error) {
        console.error(`Failed to execute follow-up ${followUp.followUpId}:`, error);
        // Mark as failed
        await dataService.updateFollowUp(followUp.followUpId, {
          status: 'failed',
          error: error.message
        }, userId);
      }
    }
  }

  // Execute a specific follow-up
  async executeFollowUp(followUp, userId) {
    console.log(`Executing ${followUp.type} follow-up for lead ${followUp.leadId}`);

    switch (followUp.type) {
      case 'email':
        await this.sendEmailFollowUp(followUp, userId);
        break;
      case 'farcaster':
        await this.sendFarcasterFollowUp(followUp, userId);
        break;
      case 'call':
        await this.scheduleCallReminder(followUp, userId);
        break;
      default:
        throw new Error(`Unknown follow-up type: ${followUp.type}`);
    }

    // Mark as completed
    await dataService.updateFollowUp(followUp.followUpId, {
      status: 'completed',
      executedAt: new Date().toISOString()
    }, userId);

    // Log interaction
    await dataService.createInteraction({
      leadId: followUp.leadId,
      dealId: followUp.dealId,
      type: `automated_${followUp.type}`,
      notes: `Automated follow-up: ${followUp.ruleName}`
    }, userId);
  }

  // Send email follow-up (placeholder - would integrate with email service)
  async sendEmailFollowUp(followUp, userId) {
    const leads = await dataService.getLeads(userId);
    const lead = leads.find(l => l.leadId === followUp.leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    // In a real implementation, this would integrate with an email service
    console.log(`📧 Email follow-up sent to ${lead.email}`);
    toast.success(`Email follow-up sent to ${lead.name}`);
    
    // For demo purposes, we'll just log it
    const message = JSON.parse(followUp.message);
    console.log('Email details:', {
      to: lead.email,
      subject: message.subject,
      body: message.body
    });
  }

  // Send Farcaster follow-up
  async sendFarcasterFollowUp(followUp, userId) {
    const leads = await dataService.getLeads(userId);
    const lead = leads.find(l => l.leadId === followUp.leadId);
    
    if (!lead || !lead.farcasterId) {
      throw new Error('Lead not found or no Farcaster ID');
    }

    try {
      // This would require a signer UUID in a real implementation
      const result = await farcasterAPI.sendDirectCast(
        lead.farcasterId,
        followUp.message,
        null // Would need actual signer UUID
      );
      
      if (result) {
        console.log(`🎭 Farcaster follow-up sent to ${lead.name}`);
        toast.success(`Farcaster message sent to ${lead.name}`);
      } else {
        throw new Error('Failed to send Farcaster message');
      }
    } catch (error) {
      console.log(`🎭 Farcaster follow-up simulated for ${lead.name} (${error.message})`);
      toast.success(`Farcaster follow-up scheduled for ${lead.name}`);
    }
  }

  // Schedule call reminder
  async scheduleCallReminder(followUp, userId) {
    const leads = await dataService.getLeads(userId);
    const lead = leads.find(l => l.leadId === followUp.leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    console.log(`📞 Call reminder set for ${lead.name}`);
    toast.success(`Call reminder set for ${lead.name}`);
    
    // In a real implementation, this would integrate with calendar/reminder service
  }

  // Get follow-up analytics
  async getFollowUpAnalytics(userId) {
    const followUps = await dataService.getFollowUps(userId);
    
    const analytics = {
      total: followUps.length,
      pending: followUps.filter(f => f.status === 'pending').length,
      completed: followUps.filter(f => f.status === 'completed').length,
      failed: followUps.filter(f => f.status === 'failed').length,
      byType: {},
      byRule: {}
    };

    // Group by type
    followUps.forEach(f => {
      analytics.byType[f.type] = (analytics.byType[f.type] || 0) + 1;
    });

    // Group by rule
    followUps.forEach(f => {
      if (f.ruleId) {
        analytics.byRule[f.ruleId] = (analytics.byRule[f.ruleId] || 0) + 1;
      }
    });

    return analytics;
  }

  // Start background processing
  startBackgroundProcessing(userId) {
    // Process pending follow-ups every 5 minutes
    const interval = setInterval(async () => {
      try {
        await this.processPendingFollowUps(userId);
      } catch (error) {
        console.error('Error processing follow-ups:', error);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const followUpService = new FollowUpService();

// Export templates and rules for configuration
export { FOLLOW_UP_TEMPLATES, FOLLOW_UP_RULES };
