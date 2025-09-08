import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadsView from './components/LeadsView';
import DealsView from './components/DealsView';
import CustomersView from './components/CustomersView';
import { CRMProvider } from './context/CRMContext';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <LeadsView />;
      case 'deals':
        return <DealsView />;
      case 'customers':
        return <CustomersView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <CRMProvider>
      <div className="flex h-screen bg-dark-bg">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-1 flex flex-col">
          <header className="bg-dark-surface border-b border-gray-700 px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-dark-text">SmartCRM</h1>
            <ConnectButton />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {renderView()}
          </main>
        </div>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#eee6ff',
            border: '1px solid #16213e'
          }
        }}
      />
    </CRMProvider>
  );
}

export default App;
