'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, Globe, Home, Search, FileText, Settings, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteSetting {
  id: string;
  key: string;
  value: any;
  page: string;
  section: string;
}

interface ProductionLogo {
  id: string;
  name: string;
  logo_url: string;
  logo_type: 'production' | 'company';
  display_order: number;
  is_active: boolean;
}

interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

async function uploadVideoToS3(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'videos');

  try {
    const response = await fetch('/api/upload-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
}

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  // Home Page Content States
  const [heroVideo, setHeroVideo] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [productionLogos, setProductionLogos] = useState<ProductionLogo[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Footer Content States
  const [footerDescription, setFooterDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Edit States
  const [editingLogo, setEditingLogo] = useState<ProductionLogo | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newLogoForm, setNewLogoForm] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState(false);

  useEffect(() => {
    fetchAllContent();
  }, []);

  async function fetchAllContent() {
    setLoading(true);
    try {
      // Fetch site settings
      const { data: settings } = await supabase
        .from('site_settings')
        .select('*');

      if (settings) {
        settings.forEach(setting => {
          const value = typeof setting.value === 'string' ? setting.value.replace(/^"|"$/g, '') : setting.value;
          switch(setting.key) {
            case 'hero_video': setHeroVideo(value); break;
            case 'hero_title': setHeroTitle(value); break;
            case 'hero_subtitle': setHeroSubtitle(value); break;
            case 'footer_description': setFooterDescription(value); break;
            case 'contact_phone': setContactPhone(value); break;
            case 'contact_email': setContactEmail(value); break;
            case 'contact_address': setContactAddress(value); break;
          }
        });
      }

      // Fetch production logos
      const { data: logos } = await supabase
        .from('production_logos')
        .select('*')
        .order('display_order');
      if (logos) setProductionLogos(logos);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('display_order');
      if (servicesData) setServices(servicesData);

      // Fetch social links
      const { data: social } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order');
      if (social) setSocialLinks(social);

      // Fetch categories for footer
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');
      if (cats) setCategories(cats);

    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSiteSetting(key: string, value: string, page: string, section: string) {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          page,
          section,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  }

  async function handleVideoUpload() {
    if (!selectedVideoFile) return;

    setUploadingVideo(true);
    try {
      const videoUrl = await uploadVideoToS3(selectedVideoFile);
      await saveSiteSetting('hero_video', videoUrl, 'home', 'hero');
      setHeroVideo(videoUrl);
      setSelectedVideoFile(null);
      alert('Video uploaded and saved successfully!');
    } catch (error) {
      alert('Error uploading video');
    } finally {
      setUploadingVideo(false);
    }
  }

  async function saveAllHomeContent() {
    setSaving(true);
    try {
      // Save all home page settings
      await Promise.all([
        saveSiteSetting('hero_video', heroVideo, 'home', 'hero'),
        saveSiteSetting('hero_title', heroTitle, 'home', 'hero'),
        saveSiteSetting('hero_subtitle', heroSubtitle, 'home', 'hero'),
      ]);
      alert('Home page content saved successfully!');
    } catch (error) {
      alert('Error saving content');
    } finally {
      setSaving(false);
    }
  }

  async function saveFooterContent() {
    setSaving(true);
    try {
      await Promise.all([
        saveSiteSetting('footer_description', footerDescription, 'global', 'footer'),
        saveSiteSetting('contact_phone', contactPhone, 'global', 'footer'),
        saveSiteSetting('contact_email', contactEmail, 'global', 'footer'),
        saveSiteSetting('contact_address', contactAddress, 'global', 'footer'),
      ]);
      alert('Footer content saved successfully!');
    } catch (error) {
      alert('Error saving footer content');
    } finally {
      setSaving(false);
    }
  }

  async function addProductionLogo(logo: Partial<ProductionLogo>) {
    try {
      const { error } = await supabase
        .from('production_logos')
        .insert([{
          ...logo,
          display_order: productionLogos.length + 1
        }]);

      if (error) throw error;
      fetchAllContent();
      setNewLogoForm(false);
    } catch (error: any) {
      alert('Error adding logo: ' + error.message);
    }
  }

  async function updateProductionLogo(id: string, updates: Partial<ProductionLogo>) {
    try {
      const { error } = await supabase
        .from('production_logos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchAllContent();
      setEditingLogo(null);
    } catch (error: any) {
      alert('Error updating logo: ' + error.message);
    }
  }

  async function deleteProductionLogo(id: string) {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    try {
      const { error } = await supabase
        .from('production_logos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAllContent();
    } catch (error: any) {
      alert('Error deleting logo: ' + error.message);
    }
  }

  async function addService(service: Partial<Service>) {
    try {
      const { error } = await supabase
        .from('services')
        .insert([{
          ...service,
          display_order: services.length + 1,
          is_active: true
        }]);

      if (error) throw error;
      fetchAllContent();
      setNewServiceForm(false);
    } catch (error: any) {
      alert('Error adding service: ' + error.message);
    }
  }

  async function updateService(id: string, updates: Partial<Service>) {
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchAllContent();
      setEditingService(null);
    } catch (error: any) {
      alert('Error updating service: ' + error.message);
    }
  }

  async function deleteService(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAllContent();
    } catch (error: any) {
      alert('Error deleting service: ' + error.message);
    }
  }

  async function updateSocialLink(id: string, url: string) {
    try {
      const { error } = await supabase
        .from('social_links')
        .update({ url, is_active: url ? true : false })
        .eq('id', id);

      if (error) throw error;
      alert('Social link updated!');
    } catch (error: any) {
      alert('Error updating social link: ' + error.message);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Content Management System</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="home">
            <Home className="w-4 h-4 mr-2" />
            Home Page
          </TabsTrigger>
          <TabsTrigger value="footer">
            <Globe className="w-4 h-4 mr-2" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Search Page
          </TabsTrigger>
          <TabsTrigger value="other">
            <FileText className="w-4 h-4 mr-2" />
            Other Pages
          </TabsTrigger>
        </TabsList>

        {/* HOME PAGE TAB */}
        <TabsContent value="home">
          <div className="space-y-6">
            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Hero Video</label>
                  <div className="flex items-center gap-4">
                    <Input
                      value={heroVideo}
                      disabled
                      className="flex-1 bg-gray-50"
                      placeholder="No video uploaded"
                    />
                    <Button
                      onClick={() => document.getElementById('videoUpload')?.click()}
                      disabled={uploadingVideo}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingVideo ? 'Uploading...' : 'Upload New Video'}
                    </Button>
                    <input
                      id="videoUpload"
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedVideoFile(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                  {selectedVideoFile && (
                    <div className="mt-2 p-2 bg-blue-50 rounded flex items-center justify-between">
                      <span className="text-sm">Selected: {selectedVideoFile.name}</span>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleVideoUpload} disabled={uploadingVideo}>
                          {uploadingVideo ? 'Uploading...' : 'Confirm Upload'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedVideoFile(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">MP4 or WebM format recommended</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hero Title</label>
                  <Input
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Dallas Fort Worth's Largest Location Database"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hero Subtitle</label>
                  <Input
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    placeholder="65+ filming locations across North and Central Texas"
                  />
                </div>

                <Button onClick={saveAllHomeContent} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Hero Content
                </Button>
              </CardContent>
            </Card>

            {/* Production Logos */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Featured Productions</CardTitle>
                  <Button onClick={() => setNewLogoForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Logo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {newLogoForm && (
                  <div className="mb-4 p-4 border rounded">
                    <h4 className="font-medium mb-2">Add New Logo</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Input placeholder="Name" id="new-logo-name" />
                      <Input placeholder="Logo URL" id="new-logo-url" />
                      <select id="new-logo-type" className="border rounded px-3">
                        <option value="production">TV Show</option>
                        <option value="company">Company</option>
                      </select>
                    </div>
                    <div className="mt-2 space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const name = (document.getElementById('new-logo-name') as HTMLInputElement).value;
                          const url = (document.getElementById('new-logo-url') as HTMLInputElement).value;
                          const type = (document.getElementById('new-logo-type') as HTMLSelectElement).value as 'production' | 'company';
                          addProductionLogo({ name, logo_url: url, logo_type: type, is_active: true });
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setNewLogoForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productionLogos.map(logo => (
                    <div key={logo.id} className="border rounded p-4">
                      {editingLogo?.id === logo.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingLogo.name}
                            onChange={(e) => setEditingLogo({...editingLogo, name: e.target.value})}
                          />
                          <Input
                            value={editingLogo.logo_url}
                            onChange={(e) => setEditingLogo({...editingLogo, logo_url: e.target.value})}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => updateProductionLogo(logo.id, editingLogo)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingLogo(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img
                            src={logo.logo_url}
                            alt={logo.name}
                            className="h-12 object-contain mb-2"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/150x60?text=' + logo.name;
                            }}
                          />
                          <p className="text-sm font-medium">{logo.name}</p>
                          <p className="text-xs text-gray-500 mb-2">{logo.logo_type}</p>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingLogo(logo)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteProductionLogo(logo.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Our Services</CardTitle>
                  <Button onClick={() => setNewServiceForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.length === 0 ? (
                  <p className="text-gray-500">No services added yet</p>
                ) : (
                  services.map(service => (
                    <div key={service.id} className="border rounded p-4">
                      {editingService?.id === service.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingService.title}
                            onChange={(e) => setEditingService({...editingService, title: e.target.value})}
                            placeholder="Service Title"
                          />
                          <Input
                            value={editingService.icon}
                            onChange={(e) => setEditingService({...editingService, icon: e.target.value})}
                            placeholder="Icon name (e.g., MapPin, FileCheck)"
                          />
                          <Textarea
                            value={editingService.description}
                            onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                            placeholder="Service Description"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => updateService(service.id, editingService)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingService(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-2 bg-red-100 rounded">
                                <span className="text-red-600 text-sm">{service.icon}</span>
                              </div>
                              <h4 className="font-medium">{service.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingService(service)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteService(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {newServiceForm && (
                  <div className="border rounded p-4 bg-gray-50 space-y-2">
                    <h4 className="font-medium mb-2">Add New Service</h4>
                    <Input placeholder="Service Title" id="new-service-title" />
                    <Input placeholder="Icon name (e.g., MapPin)" id="new-service-icon" />
                    <Textarea placeholder="Service Description" id="new-service-desc" rows={3} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const title = (document.getElementById('new-service-title') as HTMLInputElement).value;
                          const icon = (document.getElementById('new-service-icon') as HTMLInputElement).value;
                          const desc = (document.getElementById('new-service-desc') as HTMLTextAreaElement).value;
                          addService({ title, icon, description: desc });
                        }}
                      >
                        Add Service
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setNewServiceForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FOOTER TAB */}
        <TabsContent value="footer">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Footer Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Footer Description</label>
                  <Textarea
                    value={footerDescription}
                    onChange={(e) => setFooterDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <Input
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={saveFooterContent} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Footer Content
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {socialLinks.map(link => (
                  <div key={link.id} className="flex items-center space-x-4">
                    <span className="w-24">{link.platform}:</span>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...socialLinks];
                        const index = updated.findIndex(l => l.id === link.id);
                        updated[index].url = e.target.value;
                        setSocialLinks(updated);
                      }}
                      placeholder={`https://${link.platform.toLowerCase()}.com/...`}
                    />
                    <Button
                      size="sm"
                      onClick={() => updateSocialLink(link.id, link.url)}
                    >
                      Save
                    </Button>
                  </div>
                ))}
                <p className="text-sm text-gray-500 mt-2">
                  * Leave empty to hide the social icon from footer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Categories (from Database)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  These categories are pulled automatically from the database and displayed in the footer.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="text-sm">
                      • {cat.name}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  To edit categories, go to the Categories management page.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEARCH PAGE TAB */}
        <TabsContent value="search">
          <Card>
            <CardContent className="py-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Search page content management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OTHER PAGES TAB */}
        <TabsContent value="other">
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Other pages content management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
