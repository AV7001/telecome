import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Edit, Eye, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

interface Site {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  transmission_details?: string;
}

export interface BasicNotificationParams {
  title: string;
  message: string;
  user_id: string;
  site_id: string;
  action_type: string;
  userEmail: string;
  siteName: string;
  changes: string;
  actionType: string;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const user = useAuthStore((state) => state.user);
  const createNotification = useNotificationStore((state) => state.createNotification);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('sites').select('*');
      if (error) {
        console.error('Error fetching sites:', error);
        toast.error('Failed to load sites');
      } else {
        setSites(data || []);
      }
      setLoading(false);
    };

    fetchSites();
  }, []);

  const handleEdit = (site: Site) => {
    setEditingSite({ ...site });
  };

  const handleSave = async () => {
    if (!editingSite) return;

    try {
      const oldSite = sites.find(site => site.id === editingSite.id);
      const changes = Object.keys(editingSite).reduce((acc, key) => {
        if (oldSite && oldSite[key] !== editingSite[key]) {
          acc.push(`${key}: ${oldSite[key]} -> ${editingSite[key]}`);
        }
        return acc;
      }, [] as string[]).join(", ");

      const { error } = await supabase
        .from('sites')
        .update({
          name: editingSite.name,
          location: editingSite.location,
          latitude: editingSite.latitude,
          longitude: editingSite.longitude,
          transmission_details: editingSite.transmission_details,
        })
        .eq('id', editingSite.id);

      if (error) throw error;

      await createNotification({
        title: 'Site Updated',
        message: `Site "${editingSite.name}" was updated by ${user?.email}`,
        user_id: user?.id || '',
        site_id: editingSite.id,
        action_type: 'SITE_UPDATE',
        userEmail: user?.email || '',
        siteName: editingSite.name,
        changes: changes,
        actionType: 'UPDATE',
      } as BasicNotificationParams);

      setSites(sites.map((site) => (site.id === editingSite.id ? editingSite : site)));
      setEditingSite(null);
      toast.success('Site updated successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update site');
    }
  };

  const handleCancel = () => {
    setEditingSite(null);
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sites Management</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Coordinates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingSite?.id === site.id ? (
                      <input
                        type="text"
                        value={editingSite.name}
                        onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                        className="border border-gray-300 px-3 py-1 rounded-md w-full"
                      />
                    ) : (
                      site.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingSite?.id === site.id ? (
                      <input
                        type="text"
                        value={editingSite.location}
                        onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                        className="border border-gray-300 px-3 py-1 rounded-md w-full"
                      />
                    ) : (
                      site.location
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingSite?.id === site.id ? (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={editingSite.latitude || ''}
                          onChange={(e) => setEditingSite({ ...editingSite, latitude: parseFloat(e.target.value) })}
                          className="border border-gray-300 px-3 py-1 rounded-md w-1/2"
                          placeholder="Latitude"
                        />
                        <input
                          type="number"
                          value={editingSite.longitude || ''}
                          onChange={(e) => setEditingSite({ ...editingSite, longitude: parseFloat(e.target.value) })}
                          className="border border-gray-300 px-3 py-1 rounded-md w-1/2"
                          placeholder="Longitude"
                        />
                      </div>
                    ) : (
                      `${site.latitude}, ${site.longitude}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      {editingSite?.id === site.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                          >
                            <Save className="w-5 h-5 mr-1" /> Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
                          >
                            <XCircle className="w-5 h-5 mr-1" /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(site)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                          >
                            <Edit className="w-5 h-5 mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => navigate(`/site-details/${site.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                          >
                            <Eye className="w-5 h-5 mr-1" /> View
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
