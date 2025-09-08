import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService } from '../services/dataService.js';
import { followUpService } from '../services/followUpService.js';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

const CRMContext = createContext();

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

export const CRMProvider = ({ children }) => {
  const { address } = useAccount();
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  // Initialize user and load data when wallet connects
  useEffect(() => {
    const initializeUser = async () => {
      if (!address) {
        setUser(null);
        setLeads([]);
        setDeals([]);
        setCustomers([]);
        setInteractions([]);
        setFollowUps([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get or create user
        let userData = await dataService.getUser(address);
        if (!userData) {
          userData = await dataService.createUser({
            userId: address,
            email: null,
            farcasterId: null
          });
        }
        setUser(userData);

        // Load all data
        await loadAllData(address);

        // Start follow-up processing
        followUpService.startBackgroundProcessing(address);

      } catch (err) {
        console.error('Error initializing user:', err);
        setError(err.message);
        toast.error('Failed to initialize user data');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [address]);

  // Load all CRM data
  const loadAllData = async (userId) => {
    try {
      const [leadsData, dealsData, customersData, interactionsData, followUpsData] = await Promise.all([
        dataService.getLeads(userId),
        dataService.getDeals(userId),
        dataService.getCustomers(userId),
        dataService.getInteractions(userId),
        dataService.getFollowUps(userId)
      ]);

      setLeads(leadsData);
      setDeals(dealsData);
      setCustomers(customersData);
      setInteractions(interactionsData);
      setFollowUps(followUpsData);
    } catch (err) {
      console.error('Error loading data:', err);
      throw err;
    }
  };

  const addLead = async (leadData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const newLead = await dataService.createLead(leadData, address);
      setLeads(prev => [newLead, ...prev]);
      
      // Schedule automated follow-ups
      await followUpService.scheduleFollowUp('lead_created', newLead, address);
      
      toast.success(`Lead ${newLead.name} added successfully`);
      return newLead;
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead');
      return null;
    }
  };

  const updateLead = async (leadId, updates) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const updatedLead = await dataService.updateLead(leadId, updates, address);
      setLeads(prev => prev.map(lead => 
        lead.leadId === leadId ? updatedLead : lead
      ));
      toast.success('Lead updated successfully');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const addDeal = async (dealData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const newDeal = await dataService.createDeal(dealData, address);
      setDeals(prev => [newDeal, ...prev]);
      
      // Schedule automated follow-ups based on stage
      await followUpService.scheduleFollowUp('stage_changed', newDeal, address);
      
      toast.success(`Deal ${newDeal.name} created successfully`);
      return newDeal;
    } catch (error) {
      console.error('Error adding deal:', error);
      toast.error('Failed to create deal');
      return null;
    }
  };

  const updateDeal = async (dealId, updates) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const updatedDeal = await dataService.updateDeal(dealId, updates, address);
      setDeals(prev => prev.map(deal => 
        deal.dealId === dealId ? updatedDeal : deal
      ));

      // If stage changed, schedule follow-ups
      if (updates.stage) {
        await followUpService.scheduleFollowUp('stage_changed', updatedDeal, address);
      }

      toast.success('Deal updated successfully');
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
    }
  };

  const addCustomer = async (customerData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const newCustomer = await dataService.createCustomer(customerData, address);
      setCustomers(prev => [newCustomer, ...prev]);
      toast.success(`Customer ${newCustomer.name} added successfully`);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
      return null;
    }
  };

  const addInteraction = async (interactionData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const newInteraction = await dataService.createInteraction(interactionData, address);
      setInteractions(prev => [newInteraction, ...prev]);
      toast.success('Interaction logged successfully');
      return newInteraction;
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast.error('Failed to log interaction');
      return null;
    }
  };

  const dealStages = [
    { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
    { id: 'qualified', name: 'Qualified', color: 'bg-blue-500' },
    { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
    { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500' },
    { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500' },
  ];

  // Convert a lead to a deal
  const convertLeadToDeal = async (leadId, dealData) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return null;
    }

    try {
      const lead = leads.find(l => l.leadId === leadId);
      if (!lead) {
        toast.error('Lead not found');
        return null;
      }

      const newDeal = await addDeal({
        ...dealData,
        leadId: leadId,
        name: dealData.name || `Deal for ${lead.name}`
      });

      if (newDeal) {
        // Update lead status
        await updateLead(leadId, { status: 'converted' });
      }

      return newDeal;
    } catch (error) {
      console.error('Error converting lead to deal:', error);
      toast.error('Failed to convert lead to deal');
      return null;
    }
  };

  // Get follow-up analytics
  const getFollowUpAnalytics = async () => {
    if (!address) return null;
    return await followUpService.getFollowUpAnalytics(address);
  };

  const value = {
    // Data
    user,
    leads,
    deals,
    customers,
    interactions,
    followUps,
    dealStages,
    
    // State
    loading,
    error,
    
    // Actions
    addLead,
    updateLead,
    addDeal,
    updateDeal,
    addCustomer,
    addInteraction,
    convertLeadToDeal,
    
    // Analytics
    getFollowUpAnalytics,
    
    // Utilities
    loadAllData: () => address ? loadAllData(address) : null,
  };

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
};
