import React, { useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { BottomBar } from './components/layout/BottomBar';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { CreateWizard } from './pages/CreateWizard';
import { TemplatesPage } from './pages/TemplatesPage';
import ExportsCenter from './pages/ExportsCenter';
import AdminConsole from './pages/AdminConsole';
import { getHealth } from './api/orders';
import useDesignStore from './store/useDesignStore';
import { useHistoryRouter } from './hooks/useHistoryRouter';

export default function App() {
  useHistoryRouter(); // Initialize popstate and history routing sync

  const currentRoute = useDesignStore(s => s.currentRoute);
  const setRoute = useDesignStore(s => s.setRoute);
  const setHealth = useDesignStore(s => s.setHealth);

  // Poll backend health every 15 seconds
  useEffect(() => {
    const check = async () => {
      try {
        const res = await getHealth();
        setHealth(res.data);
      } catch {
        setHealth(null);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#07080c]">
      <TopBar onPageChange={setRoute} activePage={currentRoute} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {currentRoute === 'dashboard' && <Dashboard />}
        {currentRoute === 'workspace' && <Workspace />}
        {currentRoute === 'create-wizard' && <CreateWizard />}
        {currentRoute === 'templates' && <TemplatesPage />}
        {currentRoute === 'exports' && <ExportsCenter />}
        {currentRoute === 'admin' && <AdminConsole />}
      </div>

      <BottomBar />
    </div>
  );
}
