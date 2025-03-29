import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trash, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@tmcw/togeojson';

interface FiberRoute {
  id: string;
  route_data: string;
  description: string;
}

import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { text } from 'express';

interface GeoJsonData extends FeatureCollection<Geometry | null, GeoJsonProperties> {}

interface FiberRouteFormProps {
  onClose: () => void;
  onSuccess: () => void;
  siteId: string;
  selectedRoute?: FiberRoute | null;
}

export function FiberRouteForm({ onClose, onSuccess, siteId, selectedRoute }: FiberRouteFormProps): JSX.Element {
  const [formData, setFormData] = useState({
    route_data: '',
    description: '',
    geoJsonData: null as GeoJsonData | null
  });

  useEffect(() => {
    if (selectedRoute) {
      setFormData({
        route_data: selectedRoute.route_data,
        description: selectedRoute.description,
        geoJsonData: null
      });
    }
  }, [selectedRoute]);

  const parseKMLData = (kmlString: string) => {
    try {
      // Ensure KML string has proper XML structure
      if (!kmlString.includes('<?xml')) {
        kmlString = `<?xml version="1.0" encoding="UTF-8"?>${kmlString}`;
      }

      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlString, 'text/xml');
      
      // Check for parsing errors
      const parserError = kmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        console.error('XML parsing error:', parserError[0].textContent);
        return null;
      }

      const geoJsonData = toGeoJSON.kml(kmlDoc) as GeoJsonData;
      
      // Validate GeoJSON data
      if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
        console.error('Invalid KML data: No features found');
        return null;
      }

      console.log('Parsed GeoJSON:', geoJsonData);
      return geoJsonData;
    } catch (error) {
      console.error('Error parsing KML:', error);
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      console.log('Raw KML text:', text);

      const geoJsonData = parseKMLData(text);
      if (!geoJsonData) {
        toast.error('Invalid KML file format');
        return;
      }

      setFormData(prev => ({
        ...prev,
        route_data: text,
        geoJsonData
      }));
      toast.success('KML file loaded successfully');
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read KML file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.route_data || !formData.description) {
      toast.error('Please provide both route data and description');
      return;
    }

    try {
      const routeData = {
        site_id: siteId,
        route_data: formData.route_data,
        description: formData.description,
        geo_json: formData.geoJsonData // Store the parsed GeoJSON as well
      };

      const { data, error } = await supabase
        .from('fiber_routes')
        .insert([routeData]);

      if (error) throw error;

      toast.success('Fiber route saved successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving fiber route:', error);
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
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".kml,.kmz"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <textarea
                  value={formData.route_data}
                  onChange={(e) => setFormData({ ...formData, route_data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  placeholder="Or paste KML data here..."
                />
              </div>
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
