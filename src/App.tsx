import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { OnboardingGateway } from './components/OnboardingGateway';
import { CollectorMobileApp } from './components/CollectorMobileApp';
import { RecyclerErpDashboard } from './components/RecyclerErpDashboard';
import { GovernmentAuditPortal } from './components/GovernmentAuditPortal';
import { PublicOrderTrackingView } from './components/PublicOrderTrackingView';

const AppRouter: React.FC = () => {
  const { currentView, activePublicOrderId, setActivePublicOrderId, lots } = useApp();

  // Check URL query param ?orderId=LOT-XXXX
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlOrderId = params.get('orderId');
      if (urlOrderId && !activePublicOrderId) {
        setActivePublicOrderId(urlOrderId);
      }
    } catch {
      // ignore
    }
  }, [activePublicOrderId, setActivePublicOrderId]);

  if (activePublicOrderId) {
    const matchedLot = lots.find((l) => l.id === activePublicOrderId);
    return (
      <PublicOrderTrackingView
        orderId={activePublicOrderId}
        lot={matchedLot}
        onBackToApp={() => {
          setActivePublicOrderId(null);
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('orderId');
            url.searchParams.delete('view');
            window.history.replaceState({}, '', url.pathname);
          } catch {
            // ignore
          }
        }}
      />
    );
  }

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

