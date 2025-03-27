import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trash, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

interface FiberRoute {
  id: string;
  route_data: string;
  description: string;
}

interface FiberRouteFormProps {
  onClose: () => void;
  onSuccess: () => void;
  siteId: string;
  selectedRoute?: FiberRoute | null;
}

export function FiberRouteForm({ onClose, onSuccess, siteId, selectedRoute }: FiberRouteFormProps): JSX.Element {
  const [formData, setFormData] = useState({
    route_data: '',
    description: ''
  });

  useEffect(() => {
    if (selectedRoute) {
      setFormData({
        route_data: selectedRoute.route_data,
        description: selectedRoute.description,
      });
    }
  }, [selectedRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('fiber_routes')
        .insert([{
          site_id: siteId,
          route_data: formData.route_data,
          description: formData.description
        }]);

      if (error) throw error;

      console.log('Fiber route saved successfully:', data);
      toast.success('Fiber route saved successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving fiber route:', err);
      toast.error('Failed to save fiber route');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{selectedRoute ? 'Edit' : 'Add'} Fiber Route</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Data (KML/KMZ)
              </label>
              <textarea
                required
                value={formData.route_data}
                onChange={(e) => setFormData({ ...formData, route_data: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={10}
                placeholder="Paste KML/KMZ data here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter route description..."
              />
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
              {selectedRoute ? 'Update' : 'Add'} Route
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FiberRouteList({ siteId }: { siteId: string }) {
  const [routes, setRoutes] = useState<FiberRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<FiberRoute | null>(null);

  useEffect(() => {
    async function fetchRoutes() {
      const { data, error } = await supabase
        .from('fiber_routes')
        .select('*')
        .eq('site_id', siteId);
      if (error) console.error(error);
      else setRoutes(data || []);
    }
    fetchRoutes();
  }, [siteId]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fiber_routes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setRoutes(routes.filter(route => route.id !== id));
    } catch (error) {
      console.error('Error deleting fiber route:', error);
      toast.error('Failed to delete fiber route');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Fiber Routes</h2>
      <ul className="space-y-4">
        {routes.map(route => (
          <li key={route.id} className="flex justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">{route.description}</p>
              <p className="text-gray-600 text-sm">{route.route_data.substring(0, 50)}...</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setSelectedRoute(route)} className="text-blue-600 hover:text-blue-800">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(route.id)} className="text-red-600 hover:text-red-800">
                <Trash className="w-5 h-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedRoute && (
        <FiberRouteForm
          onClose={() => setSelectedRoute(null)}
          onSuccess={() => setSelectedRoute(null)}
          siteId={siteId}
          selectedRoute={selectedRoute}
        />
      )}
    </div>
  );
}
