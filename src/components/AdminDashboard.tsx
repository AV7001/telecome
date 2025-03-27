import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Users, MapPin, Router, Filter as Fiber, Image as ImageIcon, Network, Map, LogOut, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteForm } from './SiteForm';
import { NetworkDeviceForm } from './NetworkDeviceForm';
import { FiberRouteForm } from './FiberRouteForm';
import { UserManagementForm } from './UserManagementForm';
import { useAuthStore } from '../store/authStore';
import Notification from './Notification';

interface Site {
  id: string;
  name: string;
  location: string;
  power_details: string;
  transmission_details: string;
  landlord_details: {
    name: string;
    contact: string;
    agreement_date: string;
  };
  nea_details: {
    approval_number: string;
    approval_date: string;
  };
}

interface NetworkDevice {
  id: string;
  name: string;
  device_type: string;
  ip_address: string;
  status: string;
}

interface FiberRoute {
  id: string;
  description: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

export function AdminDashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [routes, setRoutes] = useState<FiberRoute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [showNetworkForm, setShowNetworkForm] = useState(false);
  const [showFiberForm, setShowFiberForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const navigate = useNavigate();
  const signOut = useAuthStore(state => state.signOut);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sitesData, devicesData, routesData, usersData] = await Promise.all([
        supabase.from('sites').select('*'),
        supabase.from('network_devices').select('*'),
        supabase.from('fiber_routes').select('*'),
        supabase.from('profiles').select('*')
      ]);

      if (sitesData.error) throw sitesData.error;
      if (devicesData.error) throw devicesData.error;
      if (routesData.error) throw routesData.error;
      if (usersData.error) throw usersData.error;

      setSites(sitesData.data || []);
      setDevices(devicesData.data || []);
      setRoutes(routesData.data || []);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSite(siteId: string) {
    if (!window.confirm('Are you sure you want to delete this site?')) return;

    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;
      await loadData();
      setNotificationMessage('Site deleted successfully!');
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    console.log('Deleting user:', userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      await loadData();
      setNotificationMessage('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function handleCreateTask(userId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          assigned_to: userId,
          description: window.prompt('Enter task description:'),
          site_id: window.prompt('Enter site ID:')
        }]);

      if (error) throw error;
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notificationMessage && (
          <Notification message={notificationMessage} onClose={() => setNotificationMessage('')} />
        )}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Link
              to="/site-map"
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Map className="w-5 h-5 mr-2" />
              View Map
            </Link>
            <Link
              to="/site-images"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Manage Images
            </Link>
            <button 
              onClick={() => setShowSiteForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add New Site
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Total Sites</h3>
                <p className="text-2xl font-bold">{sites.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Network className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Network Devices</h3>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Fiber className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Fiber Routes</h3>
                <p className="text-2xl font-bold">{routes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Users</h3>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sites Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Sites</h2>
              <button
                onClick={() => setShowSiteForm(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {sites.map((site) => (
                  <div key={site.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{site.name}</h3>
                      <p className="text-sm text-gray-500">{site.location}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin/sites/${site.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSite(site.id);
                          setShowNetworkForm(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Network className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSite(site.id);
                          setShowFiberForm(true);
                        }}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <Fiber className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Users</h2>
              <button
                onClick={() => setShowUserForm(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{user.email}</h3>
                      <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCreateTask(user.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PlusCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSiteForm && (
        <SiteForm
          onClose={() => setShowSiteForm(false)}
          onSuccess={loadData}
        />
      )}

      {showNetworkForm && selectedSite && (
        <NetworkDeviceForm
          onClose={() => {
            setShowNetworkForm(false);
            setSelectedSite('');
          }}
          onSuccess={loadData}
          siteId={selectedSite}
        />
      )}

      {showFiberForm && selectedSite && (
        <FiberRouteForm
          onClose={() => {
            setShowFiberForm(false);
            setSelectedSite('');
          }}
          onSuccess={loadData}
          siteId={selectedSite}
        />
      )}

      {showUserForm && (
        <UserManagementForm
          onClose={() => setShowUserForm(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}