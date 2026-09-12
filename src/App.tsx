import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { OnboardingGateway } from './components/OnboardingGateway';
import { CollectorMobileApp } from './components/CollectorMobileApp';
import { RecyclerErpDashboard } from './components/RecyclerErpDashboard';
import { GovernmentAuditPortal } from './components/GovernmentAuditPortal';
import { PublicOrderTrackingView } from './components/PublicOrderTrackingView';

const AppRouter: React.FC = () => {
  const { currentView, activePublicOrderId, setActivePublicOrderId, lots } = useApp();
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('orderId') || params.get('lotId') || params.get('track');
    }
    return null;
  });

  useEffect(() => {
    const checkParams = () => {
      const params = new URLSearchParams(window.location.search);
      setTrackingOrderId(params.get('orderId') || params.get('lotId') || params.get('track'));
    };
    window.addEventListener('popstate', checkParams);
    return () => window.removeEventListener('popstate', checkParams);
  }, []);

  const effectiveOrderId = activePublicOrderId || trackingOrderId;

  if (effectiveOrderId) {
    const matchedLot = lots.find((l) => l.id.toUpperCase() === effectiveOrderId.toUpperCase());
    return (
      <PublicOrderTrackingView
        orderId={effectiveOrderId}
        lot={matchedLot}
        onBackToApp={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('orderId');
            url.searchParams.delete('lotId');
            url.searchParams.delete('track');
            url.searchParams.delete('view');
            window.history.pushState({}, '', url.pathname);
          }
          setTrackingOrderId(null);
          setActivePublicOrderId(null);
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

