import React, { useEffect, useState } from 'react';
import { 
  Building2, Users, MapPin, Router, Filter, Bell, Map, 
  LogOut, Eye, PlusCircle, Network, Image as ImageIcon, Trash2 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
  site_id: string;
  name: string;
  device_type: string;
  ip_address: string;
  status: string;
}

interface FiberRoute {
  id: string;
  site_id: string;
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

  const menuItems = [
    { title: 'Sites', icon: <Building2 className="w-6 h-6" />, count: sites.length },
    { title: 'Network Devices', icon: <Router className="w-6 h-6" />, count: devices.length },
    { title: 'Fiber Routes', icon: <Filter className="w-6 h-6" />, count: routes.length },
    { title: 'Users', icon: <Users className="w-6 h-6" />, count: users.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-6 h-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowSiteForm(true)}
              className="flex items-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <PlusCircle className="w-5 h-5 mr-3" />
              Add New Site
            </button>
            <Link
              to="/site-map"
              className="flex items-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
            >
              <Map className="w-5 h-5 mr-3" />
              View Site Map
            </Link>
            <Link
              to="/site-images"
              className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <ImageIcon className="w-5 h-5 mr-3" />
              Manage Images
            </Link>
            <button
              onClick={() => setShowUserForm(true)}
              className="flex items-center p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
            >
              <Users className="w-5 h-5 mr-3" />
              Add User
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuItems.map((item) => (
            <div key={item.title} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                {React.cloneElement(item.icon, { className: 'w-8 h-8 text-gray-500' })}
                <div className="ml-4">
                  <p className="text-lg font-medium text-gray-600">{item.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{item.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sites List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Sites</h2>
                <button
                  onClick={() => setShowSiteForm(true)}
                  className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-auto">
              {sites.map((site) => (
                <div key={site.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{site.name}</h3>
                      <p className="text-sm text-gray-500">{site.location}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSite(site.id);
                          setShowNetworkForm(true);
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600"
                        title="Add Network Device"
                      >
                        <Router className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSite(site.id);
                          setShowFiberForm(true);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Add Fiber Route"
                      >
                        <Filter className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/sites/${site.id}`)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View Site"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Site"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {/* Show associated devices and routes */}
                  <div className="mt-2 pl-4 text-sm">
                    <div className="flex space-x-4">
                      <span className="text-purple-600">
                        {devices.filter(d => d.site_id === site.id).length} Devices
                      </span>
                      <span className="text-green-600">
                        {routes.filter(r => r.site_id === site.id).length} Routes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Users</h2>
                <button
                  onClick={() => setShowUserForm(true)}
                  className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-auto">
              {users.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{user.email}</h3>
                      <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCreateTask(user.id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <PlusCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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