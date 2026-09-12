import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { OnboardingGateway } from './components/OnboardingGateway';
import { CollectorMobileApp } from './components/CollectorMobileApp';
import { RecyclerErpDashboard } from './components/RecyclerErpDashboard';
import { GovernmentAuditPortal } from './components/GovernmentAuditPortal';

const AppRouter: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Dynamic Viewport Isolation */}
      {currentView === 'gateway' && <OnboardingGateway />}
      {currentView === 'collector' && <CollectorMobileApp />}
      {currentView === 'recycler' && <RecyclerErpDashboard />}
      {currentView === 'government' && <GovernmentAuditPortal />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

