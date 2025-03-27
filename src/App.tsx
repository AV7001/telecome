import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLogin } from './components/AdminLogin';
import { UserLogin } from './components/UserLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { SiteImages } from './components/SiteImages';
import { SiteMap } from './components/SiteMap';
import { SiteDetails } from './components/SiteDetails';
import AddPoint from './components/AddPoint';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { Toaster } from 'react-hot-toast';


function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}) {
  const { user, loading } = useAuthStore(state => ({ 
    user: state.user, 
    loading: state.loading 
  }));

  if (loading) {
    return <div className="h-screen flex justify-center items-center text-lg font-semibold">Checking authentication...</div>;
  }

  if (!user) {
    console.warn('User not authenticated, redirecting to login.');
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.warn(`User role (${user.role}) does not match required role (${requiredRole}), redirecting.`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const fetchUser = useAuthStore(state => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <><Toaster position="bottom-right" reverseOrder={false} />
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/user/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/user/login" element={<UserLogin />} />
        
        {/* Protected Routes - Wrap with Layout */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <UserDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/site-images" element={
          <ProtectedRoute>
            <Layout>
              <SiteImages />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/site-map" element={
          <ProtectedRoute>
            <Layout>
              <SiteMap />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/site-details/:siteId" element={
          <ProtectedRoute>
            <Layout>
              <SiteDetails />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/add-point/:siteId" element={
          <ProtectedRoute>
            <Layout>
              <AddPoint />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/sites/:siteId" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <SiteDetails />
            </Layout>
          </ProtectedRoute>
        } />
        {/* Remove the AllSites route */}
      </Routes>
    </Router>
    </>
  );
}

export default App;
