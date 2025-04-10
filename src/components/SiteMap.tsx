import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as turf from '@turf/turf';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Tooltip } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { DOMParser } from '@xmldom/xmldom';
import * as toGeoJSON from '@tmcw/togeojson';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Helper functions for coordinate transformation
const transformCoordinates = (coordinates: number[][]): number[][] => {
  return coordinates.map(coord => [coord[1], coord[0]]); // Swap lat/long for Leaflet
};

const onEachFeature = (feature: any, layer: any) => {
  if (feature.geometry.type === 'LineString') {
    const coordinates = transformCoordinates(feature.geometry.coordinates);
    layer.setLatLngs(coordinates);
  }
};

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
  site_id: string;
}

interface AllPoints extends Array<[number, number]> {}

interface GeoJsonData {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: number[][];
    };
    properties: any;
  }>;
  properties?: any;
}

// Add custom icon for manual points
const manualPointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

// Add custom icon for fiber route points
const yellowMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

const parseKMLData = (kmlString: string): GeoJsonData | null => {
  try {
    // Ensure KML string is properly formatted
    if (!kmlString || !kmlString.trim()) {
      console.error('Empty KML data');
      return null;
    }

    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlString, 'text/xml');

    // Check for parsing errors
    const parserError = kmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      console.error('XML parsing error:', parserError[0].textContent);
      return null;
    }

    // Extract route name from KML document (if available at document level)
    const routeName = kmlDoc.getElementsByTagName('name')[0]?.textContent || null;
    console.log('Route name from KML:', routeName);

    // Convert KML to GeoJSON
    const geoJsonData = toGeoJSON.kml(kmlDoc);
    console.log('Converted GeoJSON:', geoJsonData);

    // Add the route name to the GeoJSON object if it exists
    if (routeName) {
      geoJsonData.properties = geoJsonData.properties || {};
      geoJsonData.properties.name = routeName;
    }

    // Validate GeoJSON data
    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      console.error('Invalid KML data: No features found');
      return null;
    }

    // Log names of features to help with debugging
    geoJsonData.features.forEach((feature, index) => {
      console.log(`Feature ${index} name:`, feature.properties?.name);
      console.log(`Feature ${index} description:`, feature.properties?.description);
    });

    // Ensure all coordinates are valid numbers
    const sanitizedFeatures = geoJsonData.features.map(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        if (feature.geometry.type === 'LineString') {
          // For LineString geometries
          feature.geometry.coordinates = feature.geometry.coordinates
            .filter(coord => Array.isArray(coord) && coord.length >= 2)
            .map(coord => coord.map(c => typeof c === 'string' ? parseFloat(c) : c))
            .filter(coord => coord.every(c => !isNaN(c) && isFinite(c)));
        } else if (feature.geometry.type === 'Point') {
          // For Point geometries
          if (Array.isArray(feature.geometry.coordinates)) {
            feature.geometry.coordinates = feature.geometry.coordinates
              .map(c => typeof c === 'string' ? parseFloat(c) : c)
              .filter(c => !isNaN(c) && isFinite(c));
          }
        } else if (feature.geometry.type === 'MultiLineString') {
          // For MultiLineString geometries
          feature.geometry.coordinates = feature.geometry.coordinates
            .map(lineString =>
              lineString
                .filter(coord => Array.isArray(coord) && coord.length >= 2)
                .map(coord => coord.map(c => typeof c === 'string' ? parseFloat(c) : c))
                .filter(coord => coord.every(c => !isNaN(c) && isFinite(c)))
            )
            .filter(lineString => lineString.length > 0);
        }
      }
      return feature;
    });

    // Recreate the GeoJSON object with sanitized features
    const sanitizedGeoJson = {
      ...geoJsonData,
      features: sanitizedFeatures
    };

    return sanitizedGeoJson as GeoJsonData;
  } catch (error) {
    console.error('Error parsing KML:', error);
    return null;
  }
};

export function SiteMap() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<[number, number]>([27.7172, 85.3240]);
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Array<Site | Point>>([]);
  const [fiberRoutes, setFiberRoutes] = useState<any[]>([]);
  const [nearestFiberPoints, setNearestFiberPoints] = useState<{[key: string]: {point: number[], distance: number}}>({});
  const navigate = useNavigate();

  const calculateDistance = (point1: Point, point2: Point): number => {
    const from = turf.point([point1.longitude, point1.latitude]);
    const to = turf.point([point2.longitude, point2.latitude]);
    return turf.distance(from, to, { units: 'kilometers' });
  };

  const calculateDistanceFromCoordinates = (point1: [number, number], point2: [number, number]): number => {
    const from = turf.point([point1[1], point1[0]]);
    const to = turf.point([point2[1], point2[0]]);
    return turf.distance(from, to, { units: 'kilometers' });
  };

  const calculateTotalDistance = (allPoints: AllPoints): number => {
    let totalDistance = 0;
    for (let i = 0; i < allPoints.length - 1; i++) {
      const point1 = { latitude: allPoints[i][0], longitude: allPoints[i][1] };
      const point2 = { latitude: allPoints[i + 1][0], longitude: allPoints[i + 1][1] };
      totalDistance += calculateDistance(point1 as Point, point2 as Point);
    }
    return totalDistance;
  };

  const getAllPoints = (): AllPoints => {
    const allPoints: AllPoints = [];
    
    // Add site points if they have coordinates
    sites.forEach(site => {
      if (site.latitude && site.longitude) {
        allPoints.push([site.latitude, site.longitude]);
      }
    });

    // Add manual points if a site is selected
    if (selectedSite) {
      points.forEach(point => {
        allPoints.push([point.latitude, point.longitude]);
      });
    }

    return allPoints;
  };

  // Find the nearest fiber point to each site
  const findNearestFiberPoints = () => {
    const nearestPoints: {[key: string]: {point: number[], distance: number}} = {};
    
    sites.forEach(site => {
      if (site.latitude && site.longitude) {
        let minDistance = Infinity;
        let closestPoint: number[] = [];
        
        fiberRoutes.forEach(route => {
          if (route.geoJsonData && route.geoJsonData.features) {
            route.geoJsonData.features.forEach(feature => {
              if (feature.geometry && feature.geometry.coordinates) {
                let coords = [];
                
                // Extract coordinates based on geometry type
                if (feature.geometry.type === 'LineString') {
                  coords = feature.geometry.coordinates;
                } else if (feature.geometry.type === 'Point') {
                  coords = [feature.geometry.coordinates];
                } else if (feature.geometry.type === 'MultiLineString') {
                  coords = feature.geometry.coordinates.flat();
                }
                
                // Process each coordinate point
                coords.forEach(coord => {
                  // Skip invalid coordinates
                  if (!Array.isArray(coord) || coord.length < 2 || 
                      typeof coord[0] !== 'number' || typeof coord[1] !== 'number' ||
                      isNaN(coord[0]) || isNaN(coord[1])) {
                    return;
                  }
                  
                  // Calculate distance between site and this fiber point
                  const distance = calculateDistanceFromCoordinates(
                    [site.latitude!, site.longitude!],
                    [coord[1], coord[0]]
                  );
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = coord;
                  }
                });
              }
            });
          }
        });
        
        if (closestPoint.length > 0) {
          nearestPoints[site.id] = {
            point: closestPoint,
            distance: minDistance
          };
        }
      }
    });
    
    setNearestFiberPoints(nearestPoints);
  };

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

  useEffect(() => {
    const loadFiberRoutes = async () => {
      try {
        const { data, error } = await supabase
          .from('fiber_routes')
          .select('*');

        if (error) throw error;

        const routesWithGeoJson = data?.map(route => {
          if (!route.route_data) return { ...route, geoJsonData: null };
          
          console.log('Raw KML data:', route.route_data);
          const geoJsonData = parseKMLData(route.route_data);
          return {
            ...route,
            geoJsonData
          };
        }) || [];

        const validRoutes = routesWithGeoJson.filter(route => route.geoJsonData !== null);
        console.log('Valid routes:', validRoutes);
        
        setFiberRoutes(validRoutes);
      } catch (error) {
        console.error('Error loading fiber routes:', error);
        toast.error('Failed to load fiber routes');
      }
    };

    loadFiberRoutes();
  }, []);

  // Run findNearestFiberPoints when both sites and fiberRoutes are loaded
  useEffect(() => {
    if (sites.length > 0 && fiberRoutes.length > 0) {
      findNearestFiberPoints();
    }
  }, [sites, fiberRoutes]);

  const handleMarkerClick = (site: Site) => {
    setSelectedSite(site);
    if (site.latitude !== null && site.longitude !== null) {
      setCenter([site.latitude, site.longitude]);
    }
  };

  const handleLocationClick = (location: Site | Point) => {
    setSelectedLocations(prev => {
      if (prev.find(p => 'latitude' in p && 'longitude' in p && 
          p.latitude === location.latitude && 
          p.longitude === location.longitude)) {
        return prev.filter(p => !('latitude' in p && 'longitude' in p && 
          p.latitude === location.latitude && 
          p.longitude === location.longitude));
      }
      if (prev.length === 2) {
        return [location];
      }
      return [...prev, location];
    });
  };

  const handleDeletePoint = async (pointId: string) => {
    if (!window.confirm('Are you sure you want to delete this point?')) return;

    try {
      const { error } = await supabase
        .from('site_points')
        .delete()
        .eq('id', pointId);

      if (error) throw error;

      setPoints(points.filter(point => point.id !== pointId));
      toast.success('Point deleted successfully');
    } catch (error) {
      console.error('Error deleting point:', error);
      toast.error('Failed to delete point');
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Site Locations</h1>
            
            {selectedLocations.length === 2 && (
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Distance: {calculateDistance(
                    selectedLocations[0] as Point,
                    selectedLocations[1] as Point
                  ).toFixed(2)} kilometers
                </p>
                <p className="text-sm text-blue-600">
                  From: {('name' in selectedLocations[0] ? selectedLocations[0].name : selectedLocations[0].description)}
                  <br />
                  To: {('name' in selectedLocations[1] ? selectedLocations[1].name : selectedLocations[1].description)}
                </p>
              </div>
            )}
          </div>

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
                  site.latitude && site.longitude ? (
                    <Marker
                      key={site.id}
                      position={[site.latitude, site.longitude]}
                      eventHandlers={{
                        click: () => {
                          handleMarkerClick(site);
                          handleLocationClick(site);
                        }
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold">{site.name}</h3>
                          <p className="text-sm text-gray-600">{site.location}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLocationClick(site);
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            {selectedLocations.includes(site) ? 'Deselect' : 'Select for distance'}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
                
                {selectedSite && points.map(point => (
                  <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                    icon={manualPointIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="text-sm font-medium">{point.description}</p>
                        <div className="flex space-x-2 mt-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLocationClick(point);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {selectedLocations.includes(point) ? 'Deselect' : 'Select for distance'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePoint(point.id);
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete Point
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {selectedLocations.length === 2 && (
                  <>
                    <Polyline
                      positions={[ 
                        [selectedLocations[0].latitude!, selectedLocations[0].longitude!], 
                        [selectedLocations[1].latitude!, selectedLocations[1].longitude!] 
                      ]}
                      pathOptions={{
                        color: 'blue',
                        weight: 3,
                        opacity: 0.7,
                        dashArray: '5, 10'
                      }}
                    />
                    <Tooltip
                      position={[
                        (selectedLocations[0].latitude! + selectedLocations[1].latitude!) / 2,
                        (selectedLocations[0].longitude! + selectedLocations[1].longitude!) / 2
                      ]}
                      permanent
                    >
                      <span className="bg-white px-2 py-1 rounded shadow text-sm font-medium">
                        {calculateDistance(
                          selectedLocations[0] as Point,
                          selectedLocations[1] as Point
                        ).toFixed(2)} km
                      </span>
                    </Tooltip>
                  </>
                )}

                {getAllPoints().length > 1 && (
                  <Polyline
                    positions={getAllPoints()}
                    pathOptions={{
                      color: 'black',
                      weight: 2,
                      opacity: 1
                    }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">
                        Total path length: {calculateTotalDistance(getAllPoints()).toFixed(2)} km
                      </div>
                    </Popup>
                  </Polyline>
                )}

                {/* Connect sites to nearest fiber points */}
                {Object.entries(nearestFiberPoints).map(([siteId, data]) => {
                  const site = sites.find(s => s.id === siteId);
                  if (site && site.latitude && site.longitude && 
                      Array.isArray(data.point) && data.point.length >= 2 &&
                      typeof data.point[0] === 'number' && typeof data.point[1] === 'number' &&
                      !isNaN(data.point[0]) && !isNaN(data.point[1])) {
                    return (
                      <Polyline
                        key={`site-to-fiber-${siteId}`}
                        positions={[
                          [site.latitude, site.longitude],
                          [data.point[1], data.point[0]]
                        ]}
                        pathOptions={{
                          color: 'green',
                          weight: 2,
                          opacity: 0.7,
                          dashArray: '5, 5'
                        }}
                      >
                        <Tooltip>
                          <span className="bg-white px-2 py-1 rounded shadow text-sm font-medium">
                            Distance to fiber: {data.distance.toFixed(2)} km
                          </span>
                        </Tooltip>
                      </Polyline>
                    );
                  }
                  return null;
                })}

                {fiberRoutes.map((route) => (
                  route.geoJsonData && (
                    <React.Fragment key={route.id}>
                      <GeoJSON 
                        data={route.geoJsonData}
                        style={() => ({
                          color: '#FF0000',
                          weight: 3,
                          opacity: 1,
                          fillOpacity: 0.2
                        })}
                        onEachFeature={(feature, layer) => {
                          onEachFeature(feature, layer);
                          
                          // Add popup with name from KML properties if available
                          if (feature.properties) {
                            const popupContent = document.createElement('div');
                            popupContent.className = 'p-2';
                            
                            const title = document.createElement('h3');
                            title.className = 'font-bold';
                            
                            // Use the KML name if available, otherwise use feature description or default
                            title.textContent = feature.properties.name || 
                                              feature.properties.description || 
                                              route.description || 
                                              'Fiber Route';
                            
                            popupContent.appendChild(title);
                            
                            if (feature.properties.description && feature.properties.description !== feature.properties.name) {
                              const description = document.createElement('p');
                              description.className = 'text-sm text-gray-600';
                              description.textContent = feature.properties.description;
                              popupContent.appendChild(description);
                            }
                            
                            layer.bindPopup(popupContent);
                          }
                        }}
                      />
                      
                      {/* Map all coordinates from each feature */}
                      {route.geoJsonData.features.map((feature, featureIndex) => {
                        if (feature.geometry && feature.geometry.coordinates) {
                          // Handle different geometry types
                          let coordinates = [];
                          
                          if (feature.geometry.type === 'LineString') {
                            // Make sure each coordinate is valid
                            coordinates = feature.geometry.coordinates.filter(coord => 
                              Array.isArray(coord) && 
                              coord.length >= 2 && 
                              typeof coord[0] === 'number' && 
                              typeof coord[1] === 'number' &&
                              !isNaN(coord[0]) && 
                              !isNaN(coord[1])
                            );
                          } else if (feature.geometry.type === 'Point') {
                            // For point geometry
                            const coord = feature.geometry.coordinates;
                            if (Array.isArray(coord) && 
                                coord.length >= 2 && 
                                typeof coord[0] === 'number' && 
                                typeof coord[1] === 'number' &&
                                !isNaN(coord[0]) && 
                                !isNaN(coord[1])) {
                              coordinates = [coord];
                            }
                          } else if (feature.geometry.type === 'MultiLineString') {
                            // For MultiLineString, flatten and filter valid coordinates
                            coordinates = feature.geometry.coordinates
                              .flat()
                              .filter(coord => 
                                Array.isArray(coord) && 
                                coord.length >= 2 && 
                                typeof coord[0] === 'number' && 
                                typeof coord[1] === 'number' &&
                                !isNaN(coord[0]) && 
                                !isNaN(coord[1])
                              );
                          }
                          
                          return coordinates.map((coord, index, array) => (
                            <React.Fragment key={`${route.id}-feature-${featureIndex}-point-${index}`}>
                              {/* Only create a marker if the coordinates are valid numbers */}
                              {Array.isArray(coord) && coord.length >= 2 && 
                               typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                               !isNaN(coord[0]) && !isNaN(coord[1]) && (
                                <Marker
                                  position={[coord[1], coord[0]]}
                                  icon={yellowMarkerIcon}
                                >
                                  <Popup>
                                    <div className="p-2">
                                      {/* Use location name from KML if available */}
                                      <h3 className="font-bold">
                                        {feature.properties && feature.properties.name ? 
                                          feature.properties.name : 
                                          (feature.properties && feature.properties.description ? 
                                            feature.properties.description : 
                                            `Route Point ${index + 1}`)}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        Lat: {coord[1].toFixed(6)}<br />
                                        Lng: {coord[0].toFixed(6)}
                                      </p>
                                    </div>
                                  </Popup>
                                </Marker>
                              )}
                              
                              {/* Draw polylines between consecutive points only if both points are valid */}
                              {index < array.length - 1 && 
                               Array.isArray(coord) && coord.length >= 2 && 
                               Array.isArray(array[index + 1]) && array[index + 1].length >= 2 &&
                               typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                               typeof array[index + 1][0] === 'number' && typeof array[index + 1][1] === 'number' &&
                               !isNaN(coord[0]) && !isNaN(coord[1]) &&
                               !isNaN(array[index + 1][0]) && !isNaN(array[index + 1][1]) && (
                                <Polyline
                                  positions={[
                                    [coord[1], coord[0]],
                                    [array[index + 1][1], array[index + 1][0]]
                                  ]}
                                  pathOptions={{
                                    color: 'yellow',
                                    weight: 3,
                                    opacity: 0.7
                                  }}
                                />
                              )}
                            </React.Fragment>
                          ));
                        }
                        return null;
                      })}
                    </React.Fragment>
                  )
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}