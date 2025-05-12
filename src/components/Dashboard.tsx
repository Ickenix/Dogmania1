import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardOverview from './dashboard/DashboardOverview';

const Dashboard = () => {
  const { session } = useAuth();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardOverview />
    </div>
  );
};

export default Dashboard;