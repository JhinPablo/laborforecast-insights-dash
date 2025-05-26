
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Navbar } from '@/components/layout/Navbar';
import { Navigate } from 'react-router-dom';
import { FreePlan } from '@/components/dashboard/FreePlan';
import { SilverPlan } from '@/components/dashboard/SilverPlan';
import { GoldPlan } from '@/components/dashboard/GoldPlan';

export const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderPlanContent()}
      </main>
    </div>
  );
};

export default Dashboard;
