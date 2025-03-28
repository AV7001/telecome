// DisplayRoute.tsx
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';

interface DisplayRouteProps {
  routeData: any;
}

const DisplayRoute: React.FC<DisplayRouteProps> = ({ routeData }) => {
  const { coordinates, style }: { coordinates: [number, number][], style: string } = routeData;

  // Format coordinates for Leaflet (i.e., swap [longitude, latitude])
  const formattedCoordinates: LatLngTuple[] = coordinates.map(
    ([lon, lat]) => [lat, lon]
  );

  return (
    <MapContainer center={[47.36651432591258, 8.542123809233731]} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={formattedCoordinates} color={style} weight={3} />
    </MapContainer>
  );
};

export default DisplayRoute;
