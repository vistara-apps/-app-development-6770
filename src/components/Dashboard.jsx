import React from 'react';
import { useCRM } from '../context/CRMContext';
import StatsCard from './StatsCard';
import PipelineView from './PipelineView';
import RecentActivity from './RecentActivity';
import { Users, Target, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { leads, deals, customers } = useCRM();

  const totalRevenue = deals
    .filter(deal => deal.stage === 'closed-won')
    .reduce((sum, deal) => sum + deal.value, 0);

  const pipelineValue = deals
    .filter(deal => !['closed-won', 'closed-lost'].includes(deal.stage))
    .reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Dashboard</h1>
          <p className="text-gray-400">Overview of your sales pipeline</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Leads"
          value={leads.length}
          icon={Users}
          trend="+12%"
          color="blue"
        />
        <StatsCard
          title="Active Deals"
          value={deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length}
          icon={Target}
          trend="+8%"
          color="green"
        />
        <StatsCard
          title="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          icon={DollarSign}
          trend="+23%"
          color="yellow"
        />
        <StatsCard
          title="Customers"
          value={customers.length}
          icon={TrendingUp}
          trend="+15%"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineView />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;