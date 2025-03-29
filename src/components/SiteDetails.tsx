import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SiteForm } from './SiteForm';
import toast from 'react-hot-toast';

interface Site {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
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
  network_devices: NetworkDevice[];
  fiber_routes: FiberRoute[];
}

interface NetworkDevice {
  id: string;
  name: string;
  device_type: string;
  ip_address: string;
  status: string;
  site_id: string;
}

interface FiberRoute {
  id: string;
  description: string;
  coordinates: any;
  site_id: string;
  created_at: string;
}

export function SiteDetails() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSiteDetails();
  }, [siteId]);

  async function loadSiteDetails() {
    
    if (!siteId) return;
    
    
    try {
      const { data, error } = await supabase
      .from("sites")
      .select(`
        *,
        network_devices!site_id (*),
        fiber_routes!site_id (*)
      `)
      .eq("id", siteId)
      .single();
    

      if (error) throw error;
      console.log(data)
      setSite(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load site details');
      navigate('/admin/sites');
    } finally {
      setLoading(false);
    }
  }

  async function createNotification(message: string, type: string) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
  
      const { error } = await supabase.from('notifications').insert({
        message,
        user_id: userData.user.id,
        action_type: type,
        user_email: userData.user.email || '',
        site_id: siteId,
        is_read: false
      });
  
      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this site?')) return;

    try {
      await createNotification(
        `Site "${site?.name}" was deleted`,
        'SITE_DELETE'
      );

      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;
      toast.success('Site deleted successfully');
      navigate('/admin');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete site');
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this network device?')) return;

    try {
      const { error } = await supabase
        .from('network_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      await createNotification(
        `Network device was deleted from site "${site?.name}"`,
        'DEVICE_DELETE'
      );

      toast.success('Device deleted successfully');
      loadSiteDetails();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete device');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!window.confirm('Are you sure you want to delete this fiber route?')) return;

    try {
      const { error } = await supabase
        .from('fiber_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      await createNotification(
        `Fiber route was deleted from site "${site?.name}"`,
        'ROUTE_DELETE'
      );

      toast.success('Route deleted successfully');
      loadSiteDetails();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete route');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Site not found</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back 
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="text-blue-600 hover:underline"
        >
          ← Back 
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Site
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Site
              </button>
            </div>
          </div>

          {/* Site Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Location:</span> {site.location}</p>
                <p><span className="font-medium">Coordinates:</span> {site.latitude}, {site.longitude}</p>
                <p><span className="font-medium">Power Details:</span> {site.power_details}</p>
                <p><span className="font-medium">Transmission:</span> {site.transmission_details}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Technical Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">NEA Approval:</span> {site.nea_details.approval_number}</p>
                <p><span className="font-medium">Approval Date:</span> {site.nea_details.approval_date}</p>
                <p><span className="font-medium">Landlord:</span> {site.landlord_details.name}</p>
                <p><span className="font-medium">Contact:</span> {site.landlord_details.contact}</p>
              </div>
            </div>
          </div>

          {/* Network Devices */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Network Devices</h2>
            {site.network_devices.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {site.network_devices.map(device => (
                  <div key={device.id} className="bg-gray-50 p-4 rounded-lg relative group">
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete device"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <p><span className="font-medium">Name:</span> {device.name}</p>
                    <p><span className="font-medium">Type:</span> {device.device_type}</p>
                    <p><span className="font-medium">IP:</span> {device.ip_address}</p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {device.status}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No network devices found</p>
            )}
          </div>

          {/* Fiber Routes */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Fiber Routes</h2>
            {site.fiber_routes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {site.fiber_routes.map(route => (
                  <div key={route.id} className="bg-gray-50 p-4 rounded-lg relative group">
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete route"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <p><span className="font-medium">Description:</span> {route.description}</p>
                    <p><span className="font-medium">Created:</span> {new Date(route.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No fiber routes found</p>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <SiteForm
          siteId={siteId}
          onClose={() => setIsEditing(false)}
          onSuccess={async () => {
            await createNotification(
              `Site "${site?.name}" was updated`,
              'SITE_UPDATE'
            );
            setIsEditing(false);
            loadSiteDetails();
            toast.success('Site updated successfully');
          }}
        />
      )}
    </div>
  );
}