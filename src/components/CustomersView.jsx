import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Search, Tag } from 'lucide-react';
import CustomerCard from './CustomerCard';

const CustomersView = () => {
  const { customers } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Customers</h1>
          <p className="text-gray-400">Manage your customer relationships</p>
        </div>
      </div>

      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10 w-full max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No customers found.</p>
        </div>
      )}
    </div>
  );
};

export default CustomersView;