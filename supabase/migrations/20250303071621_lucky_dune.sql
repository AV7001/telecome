/*
  # Fix Row Level Security Policies

  1. Changes
    - Update RLS policies for sites table to allow authenticated users to insert data
    - Update RLS policies for other tables to ensure proper access
  
  2. Security
    - Maintain security while allowing proper functionality
    - Ensure authenticated users can create and update their own data
*/

-- Update sites table policies
DROP POLICY IF EXISTS "Public sites access" ON sites;
DROP POLICY IF EXISTS "Admin full access sites" ON sites;

CREATE POLICY "Authenticated users can access sites"
  ON sites
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sites"
  ON sites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their sites"
  ON sites
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (true);

-- Update site_images policies
DROP POLICY IF EXISTS "Public images access" ON site_images;
DROP POLICY IF EXISTS "Admin full access images" ON site_images;

CREATE POLICY "Authenticated users can access images"
  ON site_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert images"
  ON site_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their images"
  ON site_images
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (true);

-- Update network_devices policies
DROP POLICY IF EXISTS "Public devices access" ON network_devices;
DROP POLICY IF EXISTS "Admin full access devices" ON network_devices;

CREATE POLICY "Authenticated users can access devices"
  ON network_devices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert devices"
  ON network_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their devices"
  ON network_devices
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (true);

-- Update fiber_routes policies
DROP POLICY IF EXISTS "Public routes access" ON fiber_routes;
DROP POLICY IF EXISTS "Admin full access routes" ON fiber_routes;

CREATE POLICY "Authenticated users can access routes"
  ON fiber_routes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert routes"
  ON fiber_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their routes"
  ON fiber_routes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (true);