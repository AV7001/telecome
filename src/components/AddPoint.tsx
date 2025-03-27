import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Point {
  latitude: number;
  longitude: number;
  description: string;
}

function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AddPoint() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [point, setPoint] = useState<Point>({
    latitude: 27.7172,
    longitude: 85.3240,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [useGPS, setUseGPS] = useState(false);

  useEffect(() => {
    if (useGPS && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPoint(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get GPS location');
        }
      );
    }
  }, [useGPS]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('site_points')
        .insert([
          {
            site_id: siteId,
            latitude: point.latitude,
            longitude: point.longitude,
            description: point.description
          }
        ]);

      if (error) throw error;

      toast.success('Point added successfully');
      navigate(`/site-details/${siteId}`);
    } catch (error) {
      console.error('Error adding point:', error);
      toast.error('Failed to add point');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setPoint(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Point</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Method
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setUseGPS(true)}
                      className={`px-4 py-2 rounded-lg ${
                        useGPS 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Use GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseGPS(false)}
                      className={`px-4 py-2 rounded-lg ${
                        !useGPS 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Manual Entry
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={point.latitude}
                    onChange={(e) => setPoint(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={point.longitude}
                    onChange={(e) => setPoint(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={point.description}
                    onChange={(e) => setPoint(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Adding Point...' : 'Add Point'}
                </button>
              </form>
            </div>

            <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={[point.latitude, point.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker onLocationSelect={handleLocationSelect} />
                <Marker position={[point.latitude, point.longitude]} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
