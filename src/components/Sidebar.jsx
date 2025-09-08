import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  UserCheck,
  Settings,
  BarChart3
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'deals', label: 'Deals', icon: Target },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-dark-surface border-r border-gray-700 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h2 className="font-bold text-dark-text">SmartCRM</h2>
            <p className="text-xs text-gray-400">for Founders</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                activeView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-dark-card hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">U</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-dark-text">User</p>
            <p className="text-xs text-gray-400">Founder</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;