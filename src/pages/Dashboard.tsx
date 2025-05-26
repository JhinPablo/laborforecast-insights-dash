import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { Navigate } from 'react-router-dom';
import { FreePlan } from '@/components/dashboard/FreePlan';
import { SilverPlan } from '@/components/dashboard/SilverPlan';
import { GoldPlan } from '@/components/dashboard/GoldPlan';
import { HistoricalDashboard } from '@/components/dashboard/HistoricalDashboard';
import { SimpleReports } from '@/components/dashboard/SimpleReports';
import { PredictionsReports } from '@/components/dashboard/PredictionsReports';

export const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        // Dashboard histórico con datos reales de labor, población, fertilidad
        return <HistoricalDashboard />;
      case 'reports':
        // Reportes sencillos con datos históricos solamente
        return <SimpleReports />;
      case 'predictions':
        // Predicciones y mapa interactivo mejorado
        return <PredictionsReports />;
      default:
        return <HistoricalDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderSectionContent()}
      </main>
    </div>
  );
};

export default Dashboard;
