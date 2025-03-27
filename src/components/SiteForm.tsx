import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface SiteFormProps {
  onClose: () => void;
  onSuccess: () => void;
  siteId?: string;
}

export function SiteForm({ onClose, onSuccess, siteId }: SiteFormProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    power_details: '',
    transmission_details: '',
    landlord_details: {
      name: '',
      contact: '',
      agreement_date: '',
    },
    nea_details: {
      approval_number: '',
      approval_date: '',
    },
  });

  useEffect(() => {
    if (siteId) {
      loadSiteData();
    } else {
      generateSiteId();
    }
  }, [siteId]);

  function generateSiteId() {
    const uuid = uuidv4();
    setFormData(prev => ({ ...prev, id: uuid }));
  }

  async function loadSiteData() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          ...data,
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          power_details: data.power_details || '',
          transmission_details: data.transmission_details || '',
          landlord_details: data.landlord_details || {
            name: '',
            contact: '',
            agreement_date: '',
          },
          nea_details: data.nea_details || {
            approval_number: '',
            approval_date: '',
          },
        });
      }
    } catch (error) {
      console.error('Error loading site data:', error);
      toast.error('Failed to load site data');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const processedData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      let result;
      if (siteId) {
        result = await supabase
          .from('sites')
          .update(processedData)
          .eq('id', siteId);
      } else {
        result = await supabase
          .from('sites')
          .insert([{ ...processedData, id: formData.id }]);
      }

      if (result.error) throw result.error;

      toast.success(siteId ? 'Site updated successfully!' : 'Site created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving site:', error);
      toast.error('Failed to save site');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {siteId ? 'Edit Site' : 'Add New Site'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Site ID: {formData.id || 'Generating...'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 27.7172"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 85.3240"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Power Details
              </label>
              <textarea
                value={formData.power_details || ''}
                onChange={(e) => setFormData({ ...formData, power_details: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transmission Details
              </label>
              <textarea
                value={formData.transmission_details || ''}
                onChange={(e) => setFormData({ ...formData, transmission_details: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Landlord Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.landlord_details.name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      landlord_details: {
                        ...formData.landlord_details,
                        name: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact
                  </label>
                  <input
                    type="text"
                    value={formData.landlord_details.contact || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      landlord_details: {
                        ...formData.landlord_details,
                        contact: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agreement Date
                  </label>
                  <input
                    type="date"
                    value={formData.landlord_details.agreement_date || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      landlord_details: {
                        ...formData.landlord_details,
                        agreement_date: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">NEA Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Number
                  </label>
                  <input
                    type="text"
                    value={formData.nea_details.approval_number || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      nea_details: {
                        ...formData.nea_details,
                        approval_number: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Date
                  </label>
                  <input
                    type="date"
                    value={formData.nea_details.approval_date || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      nea_details: {
                        ...formData.nea_details,
                        approval_date: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
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
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {siteId ? 'Update Site' : 'Add Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}