import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trash2 } from 'lucide-react';
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

interface PointWithId extends Point {
  id: string;
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedPoint?: PointWithId;
}

function LocationPicker({ onLocationSelect, selectedPoint }: LocationPickerProps) {
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
  const [existingPoint, setExistingPoint] = useState<PointWithId | null>(null);

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

  useEffect(() => {
    const loadPoint = async () => {
      const pointId = new URLSearchParams(window.location.search).get('pointId');
      if (!pointId) return;

      try {
        const { data, error } = await supabase
          .from('site_points')
          .select('*')
          .eq('id', pointId)
          .single();

        if (error) throw error;
        if (data) {
          setExistingPoint(data as PointWithId);
          setPoint({
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.description
          });
        }
      } catch (error) {
        console.error('Error loading point:', error);
        toast.error('Failed to load point data');
      }
    };

    loadPoint();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (existingPoint) {
        const { error } = await supabase
          .from('site_points')
          .update({
            latitude: point.latitude,
            longitude: point.longitude,
            description: point.description
          })
          .eq('id', existingPoint.id);

        if (error) throw error;

        toast.success('Point updated successfully');
      } else {
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
      }

      navigate(`/site-details/${siteId}`);
    } catch (error) {
      console.error('Error saving point:', error);
      toast.error('Failed to save point');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingPoint || !window.confirm('Are you sure you want to delete this point?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('site_points')
        .delete()
        .eq('id', existingPoint.id);

      if (error) throw error;

      toast.success('Point deleted successfully');
      navigate(`/site-details/${siteId}`);
    } catch (error) {
      console.error('Error deleting point:', error);
      toast.error('Failed to delete point');
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {existingPoint ? 'Edit Point' : 'Add New Point'}
            </h1>
            {existingPoint && (
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Point
              </button>
            )}
          </div>

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
                  {loading ? 'Saving...' : existingPoint ? 'Update Point' : 'Add Point'}
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
