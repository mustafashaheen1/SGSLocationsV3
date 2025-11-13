'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, Globe, Home, Search, FileText, Settings, Video, MapPin, FileCheck, Image as ImageIcon, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImageToS3 } from '@/lib/s3-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string>('');
  const [editingLogo, setEditingLogo] = useState<ProductionLogo | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newLogoForm, setNewLogoForm] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState(false);

  // About Page Content
  const [aboutSections, setAboutSections] = useState<any[]>(Array(11).fill({}));

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

  useEffect(() => {
    fetchAllContent();
  }, []);

  useEffect(() => {
    if (activeTab === 'about') {
      fetchAboutContent();
    }
  }, [activeTab]);

  async function fetchAllContent() {
    setLoading(true);
    try {
      // Fetch site settings
      const { data: settings } = await supabase
        .from('site_settings')
        .select('*');

      if (settings) {
        settings.forEach(setting => {
          const value = typeof setting.value === 'string' ?
            JSON.parse(setting.value) : setting.value;

          switch (setting.key) {
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

      // Fetch categories
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

  async function fetchAboutContent() {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .eq('page', 'about')
        .order('section');

      if (data && data.length > 0) {
        const sections = [];
        for (let i = 0; i < 11; i++) {
          const sectionData = data.find(d => d.section === 'section_' + (i + 1));
          sections.push(sectionData?.content_value || {});
        }
        setAboutSections(sections);
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
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
      await Promise.all([
        saveSiteSetting('hero_video', heroVideo, 'home', 'hero'),
        saveSiteSetting('hero_title', heroTitle, 'home', 'hero'),
        saveSiteSetting('hero_subtitle', heroSubtitle, 'home', 'hero'),
      ]);
      alert('Home page content saved!');
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
      alert('Footer content saved!');
    } catch (error) {
      alert('Error saving content');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File, name: string, type: 'production' | 'company') {
    try {
      setUploadingLogo(true);
      const url = await uploadImageToS3(file);

      const { error } = await supabase
        .from('production_logos')
        .insert({
          name,
          logo_url: url,
          logo_type: type,
          display_order: productionLogos.length
        });

      if (error) throw error;

      alert('Logo uploaded successfully!');
      fetchAllContent();
      setNewLogoForm(false);
      setLogoImageFile(null);
      setLogoImagePreview('');
    } catch (error) {
      alert('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function deleteLogo(id: string) {
    if (!confirm('Delete this logo?')) return;

    try {
      const { error } = await supabase
        .from('production_logos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAllContent();
    } catch (error) {
      alert('Error deleting logo');
    }
  }

  async function saveService(service: Service) {
    try {
      const { error } = await supabase
        .from('services')
        .upsert(service);

      if (error) throw error;

      alert('Service saved!');
      setEditingService(null);
      setNewServiceForm(false);
      fetchAllContent();
    } catch (error) {
      alert('Error saving service');
    }
  }

  async function deleteService(id: string) {
    if (!confirm('Delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAllContent();
    } catch (error) {
      alert('Error deleting service');
    }
  }

  async function updateSocialLink(id: string, url: string) {
    try {
      const { error } = await supabase
        .from('social_links')
        .update({ url })
        .eq('id', id);

      if (error) throw error;
      alert('Social link updated!');
    } catch (error) {
      alert('Error updating social link');
    }
  }

  function updateAboutSection(index: number, field: string, value: string) {
    const newSections = [...aboutSections];
    if (!newSections[index]) newSections[index] = {};
    newSections[index][field] = value;
    setAboutSections(newSections);
  }

  async function handleSectionImageUpload(index: number, file?: File) {
    if (!file) return;

    try {
      const url = await uploadImageToS3(file);
      updateAboutSection(index, 'image', url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    }
  }

  async function saveAboutContent() {
    setSaving(true);
    try {
      for (let i = 0; i < aboutSections.length; i++) {
        if (aboutSections[i] && Object.keys(aboutSections[i]).length > 0) {
          await supabase
            .from('site_content')
            .upsert({
              page: 'about',
              section: 'section_' + (i + 1),
              content_key: 'data',
              content_value: aboutSections[i]
            }, {
              onConflict: 'page,section,content_key'
            });
        }
      }
      alert('About page content saved successfully!');
    } catch (error) {
      console.error('Error saving about content:', error);
      alert('Error saving content');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Content Management System</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="home">
            <Home className="w-4 h-4 mr-2" />
            Home Page
          </TabsTrigger>
          <TabsTrigger value="about">
            <Info className="w-4 h-4 mr-2" />
            About Page
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
        <TabsContent value="home" className="space-y-6">
          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Hero Video</label>
                <div className="flex items-center gap-4 mb-2">
                  <Input
                    value={heroVideo}
                    disabled
                    className="flex-1 bg-gray-50"
                    placeholder="No video uploaded"
                  />
                </div>
                <div className="flex items-center gap-4">
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
                        handleVideoUpload();
                      }
                    }}
                    className="hidden"
                  />
                </div>
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
                {saving ? 'Saving...' : 'Save Hero Content'}
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
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Production/Company Name"
                      id="logo-name"
                    />
                    <select id="logo-type" className="border rounded px-3 py-2">
                      <option value="production">Production</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={uploadingLogo}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select Image
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoImageFile(file);
                          setLogoImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                  {logoImagePreview && (
                    <img src={logoImagePreview} alt="Preview" className="mt-2 h-20" />
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => {
                        const name = (document.getElementById('logo-name') as HTMLInputElement).value;
                        const type = (document.getElementById('logo-type') as HTMLSelectElement).value as 'production' | 'company';
                        if (name && logoImageFile) {
                          handleLogoUpload(logoImageFile, name, type);
                        }
                      }}
                      disabled={uploadingLogo}
                    >
                      Save Logo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewLogoForm(false);
                        setLogoImageFile(null);
                        setLogoImagePreview('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                {productionLogos.map(logo => (
                  <div key={logo.id} className="border rounded p-2">
                    <img
                      src={logo.logo_url}
                      alt={logo.name}
                      className="h-16 w-full object-contain mb-2"
                    />
                    <p className="text-sm text-center">{logo.name}</p>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full mt-2"
                      onClick={() => deleteLogo(logo.id)}
                    >
                      Delete
                    </Button>
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
              {newServiceForm && (
                <div className="border rounded p-4">
                  <h4 className="font-medium mb-2">Add New Service</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Service Title"
                      id="new-service-title"
                    />
                    <select id="new-service-icon" className="w-full border rounded px-3 py-2">
                      <option value="MapPin">Location Pin</option>
                      <option value="FileCheck">File Check</option>
                      <option value="ImageIcon">Image</option>
                      <option value="Camera">Camera</option>
                      <option value="Video">Video</option>
                    </select>
                    <Textarea
                      placeholder="Service Description"
                      id="new-service-desc"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const title = (document.getElementById('new-service-title') as HTMLInputElement).value;
                          const icon = (document.getElementById('new-service-icon') as HTMLSelectElement).value;
                          const desc = (document.getElementById('new-service-desc') as HTMLTextAreaElement).value;

                          if (title && desc) {
                            saveService({
                              id: crypto.randomUUID(),
                              title,
                              icon,
                              description: desc,
                              display_order: services.length,
                              is_active: true
                            });
                          }
                        }}
                      >
                        Save Service
                      </Button>
                      <Button variant="outline" onClick={() => setNewServiceForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {services.map(service => (
                <div key={service.id} className="border rounded p-4">
                  {editingService?.id === service.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingService.title}
                        onChange={(e) => setEditingService({...editingService, title: e.target.value})}
                      />
                      <Textarea
                        value={editingService.description}
                        onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => saveService(editingService)}>Save</Button>
                        <Button variant="outline" onClick={() => setEditingService(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-medium">{service.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => setEditingService(service)}>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteService(service.id)}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOOTER TAB */}
        <TabsContent value="footer" className="space-y-6">
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
                  placeholder="Dallas Fort Worth's largest location database..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Phone</label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(214) 555-0100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email</label>
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="info@sgslocations.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contact Address</label>
                <Input
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="123 Main Street, Dallas, TX 75201"
                />
              </div>

              <Button onClick={saveFooterContent} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Footer Content'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {socialLinks.map(link => (
                <div key={link.id} className="flex items-center gap-4">
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
                These categories are pulled automatically from the database.
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
        </TabsContent>

        {/* ABOUT PAGE TAB */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Page Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Section 1: Main Introduction */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Section 1: Main Introduction</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={aboutSections[0]?.image || ''}
                        onChange={(e) => updateAboutSection(0, 'image', e.target.value)}
                        placeholder="https://..."
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('section1-image')?.click()}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <input
                        id="section1-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSectionImageUpload(0, e.target.files?.[0])}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={aboutSections[0]?.title || ''}
                      onChange={(e) => updateAboutSection(0, 'title', e.target.value)}
                      placeholder="The Art of Locations™"
                    />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Input
                      value={aboutSections[0]?.subtitle || ''}
                      onChange={(e) => updateAboutSection(0, 'subtitle', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Content (separate paragraphs with double line break)</Label>
                    <Textarea
                      value={aboutSections[0]?.content || ''}
                      onChange={(e) => updateAboutSection(0, 'content', e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Video Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Section 2: Video Section</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={aboutSections[1]?.title || ''}
                      onChange={(e) => updateAboutSection(1, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={aboutSections[1]?.content || ''}
                      onChange={(e) => updateAboutSection(1, 'content', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Vimeo Video URL (full iframe src URL)</Label>
                    <Input
                      value={aboutSections[1]?.videoUrl || ''}
                      onChange={(e) => updateAboutSection(1, 'videoUrl', e.target.value)}
                      placeholder="https://player.vimeo.com/video/616445043"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Centered Content */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Section 3: Centered Content</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={aboutSections[2]?.title || ''}
                      onChange={(e) => updateAboutSection(2, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={aboutSections[2]?.content || ''}
                      onChange={(e) => updateAboutSection(2, 'content', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Link Text</Label>
                    <Input
                      value={aboutSections[2]?.linkText || ''}
                      onChange={(e) => updateAboutSection(2, 'linkText', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={aboutSections[2]?.linkUrl || ''}
                      onChange={(e) => updateAboutSection(2, 'linkUrl', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sections 4-11 */}
              {[3, 4, 5, 6, 7, 8, 9, 10].map((sectionNum) => (
                <div key={sectionNum} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Section {sectionNum + 1}: Content with Image</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={aboutSections[sectionNum]?.image || ''}
                          onChange={(e) => updateAboutSection(sectionNum, 'image', e.target.value)}
                          placeholder="https://..."
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('section' + (sectionNum + 1) + '-image')?.click()}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                        <input
                          id={'section' + (sectionNum + 1) + '-image'}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSectionImageUpload(sectionNum, e.target.files?.[0])}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={aboutSections[sectionNum]?.title || ''}
                        onChange={(e) => updateAboutSection(sectionNum, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Content (separate paragraphs with double line break)</Label>
                      <Textarea
                        value={aboutSections[sectionNum]?.content || ''}
                        onChange={(e) => updateAboutSection(sectionNum, 'content', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Link Text (optional)</Label>
                      <Input
                        value={aboutSections[sectionNum]?.linkText || ''}
                        onChange={(e) => updateAboutSection(sectionNum, 'linkText', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Link URL (optional)</Label>
                      <Input
                        value={aboutSections[sectionNum]?.linkUrl || ''}
                        onChange={(e) => updateAboutSection(sectionNum, 'linkUrl', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Save button */}
              <Button
                onClick={saveAboutContent}
                disabled={saving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save About Page Content'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardContent className="py-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Search page content management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

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
