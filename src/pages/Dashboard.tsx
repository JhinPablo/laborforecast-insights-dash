
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { Navigate } from 'react-router-dom';
import { FreePlan } from '@/components/dashboard/FreePlan';
import { SilverPlan } from '@/components/dashboard/SilverPlan';
import { GoldPlan } from '@/components/dashboard/GoldPlan';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { EuropeMap } from '@/components/dashboard/EuropeMap';

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

  const renderPlanContent = () => {
    switch (profile?.subscription_plan) {
      case 'silver':
        return <SilverPlan />;
      case 'gold':
        return <GoldPlan />;
      default:
        return <FreePlan />;
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'reports':
        return <AnalyticsDashboard />;
      case 'predictions':
        return <EuropeMap />;
      default:
        return renderPlanContent();
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
