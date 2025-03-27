import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Network, Filter as Fiber, MapPin } from 'lucide-react';
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
  created_at: string;
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
  created_at: string;
}

interface FiberRoute {
  id: string;
  description: string;
  coordinates: any;
  site_id: string;
  created_at: string;
}

export function AllSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSites();
  }, []);

  // Update the loadSites function
  async function loadSites() {
    try {
      // First fetch sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('name');

      if (sitesError) throw sitesError;

      // Then fetch related data for each site
      const sitesWithRelations = await Promise.all(
        (sitesData || []).map(async (site) => {
          const [deviceData, routeData] = await Promise.all([
            supabase
              .from('network_devices')
              .select('*')
              .eq('site_id', site.id),
            supabase
              .from('fiber_routes')
              .select('*')
              .eq('site_id', site.id)
          ]);

          return {
            ...site,
            network_devices: deviceData.data || [],
            fiber_routes: routeData.data || []
          };
        })
      );

      setSites(sitesWithRelations);
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Failed to load sites');
    } finally {
      setLoading(false);
    }
  }

  // Update the handleViewDetails function
  function handleViewDetails(siteId: string) {
    navigate(`/admin/sites/${siteId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Sites</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div
            key={site.id}
            className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
              selectedSite === site.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{site.name}</h2>
                  <div className="flex items-center mt-1 text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <p className="text-sm">{site.location}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <Network className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {site.network_devices?.length || 0} Devices
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Fiber className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {site.fiber_routes?.length || 0} Routes
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleViewDetails(site.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sites.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No sites found</p>
        </div>
      )}
    </div>
  );
}