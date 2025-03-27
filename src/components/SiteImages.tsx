import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Image as ImageIcon, Upload, Trash2, ArrowLeft, FolderOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SiteImage {
  id: string;
  site_id: string;
  image_url: string;
  description: string;
  category: string;
  created_at: string;
}

interface Site {
  id: string;
  name: string;
}

export function SiteImages() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      loadImages();
    }
  }, [selectedSite]);

  async function loadSites() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSites(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sites:', error);
      setLoading(false);
    }
  }

  async function loadImages() {
    try {
      const { data, error } = await supabase
        .from('site_images')
        .select('*')
        .eq('site_id', selectedSite)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  async function handleImageUpload() {
    try {
      if (!selectedFile || !selectedSite) return;
      
      setUploading(true);
      setUploadSuccess(false);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `site-images/${selectedSite}/${category}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: publicURL } = supabase.storage
        .from('site-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('site_images')
        .insert([
          {
            site_id: selectedSite,
            image_url: publicURL.publicUrl,
            description: description,
            category: category
          },
        ]);

      if (dbError) throw dbError;

      setDescription('');
      setSelectedFile(null);
      setUploadSuccess(true);
      await loadImages();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string, imageUrl: string) {
    try {
      const filePath = imageUrl.split('/site-images/')[1]; // Ensure correct extraction

      const { error: storageError } = await supabase.storage
        .from('site-images')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      

      const { error: dbError } = await supabase
        .from('site_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      await loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  const filteredImages = activeCategory === 'all' 
    ? images 
    : images.filter(img => img.category === activeCategory);

  const categories = [
    { id: 'all', name: 'All Images' },
    { id: 'general', name: 'General' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'construction', name: 'Construction' },
    { id: 'maintenance', name: 'Maintenance' },
    { id: 'documentation', name: 'Documentation' }
  ];

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

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
          
          <button
            onClick={() => navigate('/site-map')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FolderOpen className="w-5 h-5 mr-2" />
            View Site Map
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <ImageIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Site Images</h1>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Site
            </label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSite && (
            <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload New Image</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter image description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="equipment">Equipment</option>
                    <option value="construction">Construction</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="documentation">Documentation</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Image File
                </label>
                <div className="flex items-center">
                  <label className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer">
                    <Plus className="w-5 h-5 mr-2" />
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <span className="ml-3 text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={handleImageUpload}
                  disabled={!selectedFile || uploading}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    !selectedFile || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                
                {uploadSuccess && (
                  <span className="ml-4 text-sm text-green-600 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Image uploaded successfully!
                  </span>
                )}
              </div>
            </div>
          )}

          {selectedSite && (
            <>
              <div className="flex overflow-x-auto space-x-2 mb-6 pb-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredImages.length === 0 ? (
                  <div className="col-span-full flex justify-center items-center h-40 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No images in this category</p>
                  </div>
                ) : (
                  filteredImages.map((image) => (
                    <div key={image.id} className="bg-gray-50 rounded-lg overflow-hidden shadow">
                      <img
                        src={image.image_url}
                        alt={image.description}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm text-gray-600">{image.description}</p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {image.category || 'general'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(image.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteImage(image.id, image.image_url)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}