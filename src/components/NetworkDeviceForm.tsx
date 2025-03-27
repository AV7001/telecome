import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface NetworkDeviceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  siteId: string;
  deviceId?: string; // optional device ID for updating existing device
}

export function NetworkDeviceForm({ onClose, onSuccess, siteId, deviceId }: NetworkDeviceFormProps) {
  const [formData, setFormData] = useState({
    device_type: '',
    name: '',
    ip_address: '',
    port_configuration: {},
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deviceId) {
      fetchDevice();
    }
  }, [deviceId]);

  const fetchDevice = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('network_devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (error) throw error;

      setFormData({
        device_type: data.device_type,
        name: data.name,
        ip_address: data.ip_address,
        port_configuration: data.port_configuration,
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching device:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (deviceId) {
        // Update existing device. Ensure the device details are valid before updating.
        const { error } = await supabase
          .from('network_devices')
          .update({ ...formData })
          .eq('id', deviceId);

        if (error) throw error;
        onSuccess();
        onClose();
      } else {
        // Insert new device. Validate input fields before creating.
      const { error } = await supabase
        .from('network_devices')
        .insert([{ ...formData, site_id: siteId }]).single(); // Ensure a single record is inserted.


        if (error) throw error;
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error handling device:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deviceId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this device?');
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('network_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting device:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {deviceId ? 'Edit Network Device' : 'Add Network Device'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Device Type</label>
              <select
                required
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select device type...</option>
                <option value="router">Router</option>
                <option value="switch">Switch</option>
                <option value="firewall">Firewall</option>
                <option value="access_point">Access Point</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Device Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>

            {deviceId && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Device'}
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : deviceId ? 'Update Device' : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
