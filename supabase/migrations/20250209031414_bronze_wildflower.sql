/*
  # Initial Schema Setup for Site Management System

  1. New Tables
    - `sites`
      - Basic site information including location and configuration
      - References to related details
    - `site_images`
      - Store image URLs and metadata for site photos
    - `network_devices`
      - Network equipment details including IPs and configurations
    - `fiber_connections`
      - Optical fiber connection details and core mapping
    - `fiber_routes`
      - KML/KMZ route data and metadata
    - `change_requests`
      - Track suggested changes and their approval status
    - `notifications`
      - System notifications for updates
    
  2. Security
    - Enable RLS on all tables
    - Policies for admin and regular users
    - Specific policies for change management

  3. Relationships
    - Sites to images (one-to-many)
    - Sites to network devices (one-to-many)
    - Sites to fiber connections (one-to-many)
    - Sites to fiber routes (one-to-many)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sites table
CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  configuration jsonb,
  power_details text,
  transmission_details text,
  landlord_details jsonb,
  nea_details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Site images table
CREATE TABLE site_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Network devices table
CREATE TABLE network_devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  device_type text NOT NULL,
  name text NOT NULL,
  ip_address text,
  port_configuration jsonb,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Fiber connections table
CREATE TABLE fiber_connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  connection_type text NOT NULL,
  core_mapping jsonb,
  source_device_id uuid REFERENCES network_devices(id),
  destination_device_id uuid REFERENCES network_devices(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Fiber routes table
CREATE TABLE fiber_routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  route_data text NOT NULL, -- KML/KMZ data
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Change requests table
CREATE TABLE change_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  changes jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notify_all boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id)
);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiber_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiber_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create admin role
CREATE ROLE admin;

-- Policies for sites
CREATE POLICY "Public sites access" ON sites
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin full access sites" ON sites
  FOR ALL TO admin
  USING (true)
  WITH CHECK (true);

-- Policies for site_images
CREATE POLICY "Public images access" ON site_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin full access images" ON site_images
  FOR ALL TO admin
  USING (true)
  WITH CHECK (true);

-- Policies for network_devices
CREATE POLICY "Public devices access" ON network_devices
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin full access devices" ON network_devices
  FOR ALL TO admin
  USING (true)
  WITH CHECK (true);

-- Policies for fiber_connections
CREATE POLICY "Public connections access" ON fiber_connections
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin full access connections" ON fiber_connections
  FOR ALL TO admin
  USING (true)
  WITH CHECK (true);

-- Policies for fiber_routes
CREATE POLICY "Public routes access" ON fiber_routes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin full access routes" ON fiber_routes
  FOR ALL TO admin
  USING (true)
  WITH CHECK (true);

-- Policies for change_requests
CREATE POLICY "Users can create change requests" ON change_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their change requests" ON change_requests
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admin full access change requests" ON change_requests
  FOR ALL TO admin
  USING (true)
  WITH CHECK (true);

-- Policies for notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_network_devices_updated_at
  BEFORE UPDATE ON network_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_fiber_connections_updated_at
  BEFORE UPDATE ON fiber_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_fiber_routes_updated_at
  BEFORE UPDATE ON fiber_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_change_requests_updated_at
  BEFORE UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();