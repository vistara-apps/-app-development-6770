import { supabase, isSupabaseConfigured, TABLES } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// Local storage keys
const STORAGE_KEYS = {
  LEADS: 'smartcrm_leads',
  DEALS: 'smartcrm_deals', 
  CUSTOMERS: 'smartcrm_customers',
  INTERACTIONS: 'smartcrm_interactions',
  FOLLOW_UPS: 'smartcrm_follow_ups',
  USER: 'smartcrm_user'
};

// Helper functions for local storage
const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error);
  }
};

// Data service class
class DataService {
  constructor() {
    this.useSupabase = isSupabaseConfigured();
    console.log(`DataService initialized with ${this.useSupabase ? 'Supabase' : 'localStorage'}`);
  }

  // User operations
  async getUser(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('userId', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user:', error);
        return null;
      }
      return data;
    } else {
      const user = getFromStorage(STORAGE_KEYS.USER);
      return user.userId === userId ? user : null;
    }
  }

  async createUser(userData) {
    const user = {
      userId: userData.userId || uuidv4(),
      farcasterId: userData.farcasterId || null,
      email: userData.email || null,
      createdAt: new Date().toISOString(),
      ...userData
    };

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([user])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      return data;
    } else {
      saveToStorage(STORAGE_KEYS.USER, user);
      return user;
    }
  }

  // Lead operations
  async getLeads(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.LEADS)
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching leads:', error);
        return [];
      }
      return data || [];
    } else {
      return getFromStorage(STORAGE_KEYS.LEADS);
    }
  }

  async createLead(leadData, userId) {
    const lead = {
      leadId: uuidv4(),
      userId,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone || null,
      source: leadData.source || 'manual',
      status: leadData.status || 'new',
      farcasterId: leadData.farcasterId || null,
      createdAt: new Date().toISOString(),
      ...leadData
    };

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.LEADS)
        .insert([lead])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating lead:', error);
        throw error;
      }
      return data;
    } else {
      const leads = getFromStorage(STORAGE_KEYS.LEADS);
      leads.push(lead);
      saveToStorage(STORAGE_KEYS.LEADS, leads);
      return lead;
    }
  }

  async updateLead(leadId, updates, userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.LEADS)
        .update(updates)
        .eq('leadId', leadId)
        .eq('userId', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating lead:', error);
        throw error;
      }
      return data;
    } else {
      const leads = getFromStorage(STORAGE_KEYS.LEADS);
      const index = leads.findIndex(lead => lead.leadId === leadId);
      if (index !== -1) {
        leads[index] = { ...leads[index], ...updates };
        saveToStorage(STORAGE_KEYS.LEADS, leads);
        return leads[index];
      }
      throw new Error('Lead not found');
    }
  }

  // Deal operations
  async getDeals(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.DEALS)
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching deals:', error);
        return [];
      }
      return data || [];
    } else {
      return getFromStorage(STORAGE_KEYS.DEALS);
    }
  }

  async createDeal(dealData, userId) {
    const deal = {
      dealId: uuidv4(),
      userId,
      leadId: dealData.leadId,
      name: dealData.name,
      value: dealData.value || 0,
      stage: dealData.stage || 'lead',
      expectedCloseDate: dealData.expectedCloseDate || null,
      createdAt: new Date().toISOString(),
      ...dealData
    };

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.DEALS)
        .insert([deal])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating deal:', error);
        throw error;
      }
      return data;
    } else {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      deals.push(deal);
      saveToStorage(STORAGE_KEYS.DEALS, deals);
      return deal;
    }
  }

  async updateDeal(dealId, updates, userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.DEALS)
        .update(updates)
        .eq('dealId', dealId)
        .eq('userId', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating deal:', error);
        throw error;
      }
      return data;
    } else {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const index = deals.findIndex(deal => deal.dealId === dealId);
      if (index !== -1) {
        deals[index] = { ...deals[index], ...updates };
        saveToStorage(STORAGE_KEYS.DEALS, deals);
        return deals[index];
      }
      throw new Error('Deal not found');
    }
  }

  // Customer operations
  async getCustomers(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching customers:', error);
        return [];
      }
      return data || [];
    } else {
      return getFromStorage(STORAGE_KEYS.CUSTOMERS);
    }
  }

  async createCustomer(customerData, userId) {
    const customer = {
      customerId: uuidv4(),
      userId,
      leadId: customerData.leadId || null,
      name: customerData.name,
      email: customerData.email,
      tags: customerData.tags || [],
      createdAt: new Date().toISOString(),
      ...customerData
    };

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .insert([customer])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating customer:', error);
        throw error;
      }
      return data;
    } else {
      const customers = getFromStorage(STORAGE_KEYS.CUSTOMERS);
      customers.push(customer);
      saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
      return customer;
    }
  }

  // Interaction operations
  async getInteractions(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.INTERACTIONS)
        .select('*')
        .eq('userId', userId)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching interactions:', error);
        return [];
      }
      return data || [];
    } else {
      return getFromStorage(STORAGE_KEYS.INTERACTIONS);
    }
  }

  async createInteraction(interactionData, userId) {
    const interaction = {
      interactionId: uuidv4(),
      userId,
      dealId: interactionData.dealId || null,
      customerId: interactionData.customerId || null,
      leadId: interactionData.leadId || null,
      type: interactionData.type,
      notes: interactionData.notes,
      timestamp: new Date().toISOString(),
      ...interactionData
    };

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.INTERACTIONS)
        .insert([interaction])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating interaction:', error);
        throw error;
      }
      return data;
    } else {
      const interactions = getFromStorage(STORAGE_KEYS.INTERACTIONS);
      interactions.push(interaction);
      saveToStorage(STORAGE_KEYS.INTERACTIONS, interactions);
      return interaction;
    }
  }

  // Follow-up operations
  async getFollowUps(userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.FOLLOW_UPS)
        .select('*')
        .eq('userId', userId)
        .order('scheduledDate', { ascending: true });
      
      if (error) {
        console.error('Error fetching follow-ups:', error);
        return [];
      }
      return data || [];
    } else {
      return getFromStorage(STORAGE_KEYS.FOLLOW_UPS);
    }
  }

  async createFollowUp(followUpData, userId) {
    const followUp = {
      followUpId: uuidv4(),
      userId,
      leadId: followUpData.leadId,
      dealId: followUpData.dealId || null,
      type: followUpData.type, // 'email', 'call', 'farcaster'
      message: followUpData.message,
      scheduledDate: followUpData.scheduledDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...followUpData
    };

    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.FOLLOW_UPS)
        .insert([followUp])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating follow-up:', error);
        throw error;
      }
      return data;
    } else {
      const followUps = getFromStorage(STORAGE_KEYS.FOLLOW_UPS);
      followUps.push(followUp);
      saveToStorage(STORAGE_KEYS.FOLLOW_UPS, followUps);
      return followUp;
    }
  }

  async updateFollowUp(followUpId, updates, userId) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from(TABLES.FOLLOW_UPS)
        .update(updates)
        .eq('followUpId', followUpId)
        .eq('userId', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating follow-up:', error);
        throw error;
      }
      return data;
    } else {
      const followUps = getFromStorage(STORAGE_KEYS.FOLLOW_UPS);
      const index = followUps.findIndex(f => f.followUpId === followUpId);
      if (index !== -1) {
        followUps[index] = { ...followUps[index], ...updates };
        saveToStorage(STORAGE_KEYS.FOLLOW_UPS, followUps);
        return followUps[index];
      }
      throw new Error('Follow-up not found');
    }
  }
}

// Export singleton instance
export const dataService = new DataService();
