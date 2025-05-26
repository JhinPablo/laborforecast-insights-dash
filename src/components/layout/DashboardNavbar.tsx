
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { LogOut, User, BarChart3, FileText, TrendingUp, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardNavbarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const DashboardNavbar = ({ activeSection, onSectionChange }: DashboardNavbarProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'gold': return 'bg-yellow-500 text-yellow-50';
      case 'silver': return 'bg-gray-400 text-gray-50';
      default: return 'bg-green-500 text-green-50';
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  ];

  if (!user) return null;

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LaborForecast</span>
            </div>
            
            {/* Navigation Menu */}
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(profile.subscription_plan)}`}>
                  {profile.subscription_plan.toUpperCase()}
                </span>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {profile.first_name} {profile.last_name}
                  </span>
                </div>
              </div>
            )}
            
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
