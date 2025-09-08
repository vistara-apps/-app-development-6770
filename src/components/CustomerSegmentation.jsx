import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, Filter, Tag, Users, Mail, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

const CustomerSegmentation = () => {
  const { customers, leads, deals, interactions } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  // Get all unique tags from customers
  const allTags = useMemo(() => {
    const tagSet = new Set();
    customers.forEach(customer => {
      if (customer.tags && Array.isArray(customer.tags)) {
        customer.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [customers]);

  // Enhanced customer data with computed fields
  const enhancedCustomers = useMemo(() => {
    return customers.map(customer => {
      // Find related lead
      const relatedLead = leads.find(lead => lead.leadId === customer.leadId);
      
      // Find related deals
      const relatedDeals = deals.filter(deal => deal.leadId === customer.leadId);
      const totalDealValue = relatedDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const activeDealCount = relatedDeals.filter(deal => 
        !['closed-won', 'closed-lost'].includes(deal.stage)
      ).length;
      
      // Find interactions
      const customerInteractions = interactions.filter(
        interaction => interaction.customerId === customer.customerId
      );
      const lastInteraction = customerInteractions.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      
      // Calculate days since last interaction
      const daysSinceLastInteraction = lastInteraction 
        ? Math.floor((Date.now() - new Date(lastInteraction.timestamp)) / (1000 * 60 * 60 * 24))
        : Math.floor((Date.now() - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24));

      return {
        ...customer,
        relatedLead,
        relatedDeals,
        totalDealValue,
        activeDealCount,
        interactionCount: customerInteractions.length,
        lastInteraction,
        daysSinceLastInteraction
      };
    });
  }, [customers, leads, deals, interactions]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = enhancedCustomers;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        (customer.tags && customer.tags.some(tag => 
          tag.toLowerCase().includes(term)
        ))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(customer =>
        customer.tags && selectedTags.every(tag => customer.tags.includes(tag))
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      };
      
      if (filterDays[dateFilter]) {
        filtered = filtered.filter(customer =>
          customer.daysSinceLastInteraction <= filterDays[dateFilter]
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value':
          return b.totalDealValue - a.totalDealValue;
        case 'interactions':
          return b.interactionCount - a.interactionCount;
        case 'recent':
          return a.daysSinceLastInteraction - b.daysSinceLastInteraction;
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [enhancedCustomers, searchTerm, selectedTags, dateFilter, sortBy]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setDateFilter('all');
    setSortBy('name');
  };

  const getCustomerSegment = (customer) => {
    if (customer.totalDealValue > 10000) return { label: 'High Value', color: 'bg-green-500' };
    if (customer.activeDealCount > 0) return { label: 'Active', color: 'bg-blue-500' };
    if (customer.daysSinceLastInteraction > 30) return { label: 'Inactive', color: 'bg-red-500' };
    if (customer.interactionCount > 5) return { label: 'Engaged', color: 'bg-purple-500' };
    return { label: 'Standard', color: 'bg-gray-500' };
  };

  const CustomerCard = ({ customer }) => {
    const segment = getCustomerSegment(customer);
    
    return (
      <div className="bg-dark-card rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-dark-text">{customer.name}</h3>
            <p className="text-gray-400 text-sm">{customer.email}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs text-white ${segment.color}`}>
            {segment.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-400">Deal Value:</span>
            <div className="font-medium text-green-400">
              ${customer.totalDealValue.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Interactions:</span>
            <div className="font-medium text-dark-text">
              {customer.interactionCount}
            </div>
          </div>
        </div>

        {customer.lastInteraction && (
          <div className="text-xs text-gray-400 mb-3">
            Last contact: {format(new Date(customer.lastInteraction.timestamp), 'MMM dd, yyyy')}
          </div>
        )}

        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {customer.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-dark-accent/20 text-accent text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Customer Segmentation</h1>
          <p className="text-gray-400">
            {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-dark-surface border border-gray-600 rounded-lg text-dark-text hover:border-gray-500 transition-colors"
        >
          <Filter size={16} className="mr-2" />
          Filters
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-dark-surface rounded-lg p-4 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-gray-600 rounded-lg text-dark-text placeholder-gray-500 focus:border-accent focus:outline-none"
          />
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-600">
            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="value">Deal Value</option>
                <option value="interactions">Interactions</option>
                <option value="recent">Recent Activity</option>
                <option value="created">Date Added</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Last Contact
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-dark-card border border-gray-600 rounded-lg px-3 py-2 text-dark-text focus:border-accent focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Filter by Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-accent text-white'
                          : 'bg-dark-card border border-gray-600 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <Tag size={12} className="inline mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(searchTerm || selectedTags.length > 0 || dateFilter !== 'all' || sortBy !== 'name') && (
              <button
                onClick={clearFilters}
                className="flex items-center text-sm text-gray-400 hover:text-dark-text transition-colors"
              >
                <X size={14} className="mr-1" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <CustomerCard key={customer.customerId} customer={customer} />
          ))}
        </div>
      ) : (
        <div className="bg-dark-surface rounded-lg p-8 text-center">
          <Users size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-dark-text mb-2">
            No customers found
          </h3>
          <p className="text-gray-400">
            {customers.length === 0 
              ? "You haven't added any customers yet."
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerSegmentation;
