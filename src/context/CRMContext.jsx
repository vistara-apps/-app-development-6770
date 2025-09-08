import React, { createContext, useContext, useState, useEffect } from 'react';

const CRMContext = createContext();

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

export const CRMProvider = ({ children }) => {
  const [leads, setLeads] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      source: 'Website',
      status: 'new',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      source: 'Referral',
      status: 'contacted',
      createdAt: new Date().toISOString(),
    }
  ]);

  const [deals, setDeals] = useState([
    {
      id: 1,
      leadId: 1,
      name: 'Website Redesign',
      value: 5000,
      stage: 'proposal',
      expectedCloseDate: '2024-02-15',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      leadId: 2,
      name: 'Mobile App Development',
      value: 15000,
      stage: 'negotiation',
      expectedCloseDate: '2024-03-01',
      createdAt: new Date().toISOString(),
    }
  ]);

  const [customers, setCustomers] = useState([
    {
      id: 1,
      leadId: 1,
      name: 'Acme Corp',
      email: 'contact@acme.com',
      tags: ['enterprise', 'priority'],
      createdAt: new Date().toISOString(),
    }
  ]);

  const [interactions, setInteractions] = useState([
    {
      id: 1,
      dealId: 1,
      customerId: null,
      type: 'email',
      notes: 'Sent initial proposal',
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      dealId: 2,
      customerId: null,
      type: 'call',
      notes: 'Discussed project requirements',
      timestamp: new Date().toISOString(),
    }
  ]);

  const addLead = (lead) => {
    const newLead = {
      ...lead,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setLeads(prev => [...prev, newLead]);
    return newLead;
  };

  const updateLead = (id, updates) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    ));
  };

  const addDeal = (deal) => {
    const newDeal = {
      ...deal,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setDeals(prev => [...prev, newDeal]);
    return newDeal;
  };

  const updateDeal = (id, updates) => {
    setDeals(prev => prev.map(deal => 
      deal.id === id ? { ...deal, ...updates } : deal
    ));
  };

  const addCustomer = (customer) => {
    const newCustomer = {
      ...customer,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const addInteraction = (interaction) => {
    const newInteraction = {
      ...interaction,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    setInteractions(prev => [...prev, newInteraction]);
    return newInteraction;
  };

  const dealStages = [
    { id: 'lead', name: 'Lead', color: 'bg-gray-500' },
    { id: 'qualified', name: 'Qualified', color: 'bg-blue-500' },
    { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
    { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500' },
    { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500' },
  ];

  const value = {
    leads,
    deals,
    customers,
    interactions,
    dealStages,
    addLead,
    updateLead,
    addDeal,
    updateDeal,
    addCustomer,
    addInteraction,
  };

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
};