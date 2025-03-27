import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Site {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
}

interface Point {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
}

export function SiteMap() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<[number, number]>([27.7172, 85.3240]);
  const [points, setPoints] = useState<Point[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSites = async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('id, name, location, latitude, longitude');

        if (error) throw error;

        const sitesWithCoordinates = (data || []).filter(
          site => site.latitude !== null && site.longitude !== null
        );

        setSites(sitesWithCoordinates);
      } catch (error) {
        console.error('Error loading sites:', error);
        toast.error('Failed to load sites');
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, []);

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const { data, error } = await supabase
          .from('site_points')
          .select('*')
          .eq('site_id', selectedSite?.id);

        if (error) throw error;
        setPoints(data || []);
      } catch (error) {
        console.error('Error loading points:', error);
        toast.error('Failed to load points');
      }
    };

    if (selectedSite) {
      loadPoints();
    }
  }, [selectedSite]);

  const handleMarkerClick = (site: Site) => {
    setSelectedSite(site);
    if (site.latitude !== null && site.longitude !== null) {
      setCenter([site.latitude, site.longitude]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          {selectedSite && (
            <button
              onClick={() => navigate(`/add-point/${selectedSite.id}`)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Point
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Site Locations</h1>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <p className="text-gray-500">Loading map data...</p>
            </div>
          ) : sites.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No sites with location data available</p>
              <p className="text-sm text-gray-400">Add latitude and longitude to sites to see them on the map</p>
            </div>
          ) : (
            <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200">
              <MapContainer 
                center={center} 
                zoom={10} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {sites.map(site => (
                  <Marker 
                    key={site.id} 
                    position={[site.latitude as number, site.longitude as number]}
                    eventHandlers={{ click: () => handleMarkerClick(site) }}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-medium text-gray-900">{site.name}</h3>
                        <p className="text-sm text-gray-500">{site.location}</p>
                        <button
                          onClick={() => navigate(`/add-point/${site.id}`)}
                          className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                          Add Point
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {points.map(point => (
                  <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                  >
                    <Popup>
                      <p>{point.description}</p>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
