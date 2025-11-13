'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, Globe, Home, Search, FileText, Settings, Video, MapPin, FileCheck, Image as ImageIcon, Mail, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImageToS3 } from '@/lib/s3-upload';
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string>('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string>('');

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

  // About Page Content States
  const [aboutSections, setAboutSections] = useState<any[]>([]);

  // Contact Page Grid States
  const [contactGrid, setContactGrid] = useState<any[]>([]);

  // Edit States
  const [editingLogo, setEditingLogo] = useState<ProductionLogo | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newLogoForm, setNewLogoForm] = useState(false);

  useEffect(() => {
    fetchAllContent();
  }, []);

  useEffect(() => {
    if (activeTab === 'contact') {
      fetchContactGrid();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'about' && aboutSections.length === 0) {
      fetchAboutContent();
    }
  }, [activeTab, aboutSections.length]);

  async function fetchAllContent() {
    setLoading(true);
    try {
      // Test admin authentication first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user?.email, 'User error:', userError);

      if (!user) {
        console.error('No authenticated user found');
        alert('Please log in as an admin to access this page.');
        setLoading(false);
        return;
      }

      // Check admin status
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user?.email)
        .maybeSingle();

      console.log('Admin status:', adminData, 'Admin error:', adminError);

      if (!adminData) {
        console.error('User is not an admin:', user.email);
        alert('Access denied. You must be an admin to view this page.');
        setLoading(false);
        return;
      }

      // Fetch site settings
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('*');

      console.log('Settings:', settings, 'Error:', settingsError);
      if (settingsError) console.error('Settings error details:', settingsError);

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
      const { data: logos, error: logosError } = await supabase
        .from('production_logos')
        .select('*')
        .order('display_order');

      console.log('Logos:', logos, 'Error:', logosError);
      if (logosError) console.error('Logos error details:', logosError);
      if (logos) setProductionLogos(logos);

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('display_order');

      console.log('Services:', servicesData, 'Error:', servicesError);
      if (servicesError) console.error('Services error details:', servicesError);
      if (servicesData) setServices(servicesData);

      // Fetch social links
      const { data: social, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order');

      console.log('Social:', social, 'Error:', socialError);
      if (socialError) console.error('Social links error details:', socialError);
      if (social) setSocialLinks(social);

      // Fetch categories for footer
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');

      console.log('Categories:', cats, 'Error:', catsError);
      if (catsError) console.error('Categories error details:', catsError);
      if (cats) setCategories(cats);

    } catch (error) {
      console.error('Full error details:', error);
      alert('Error loading content. Check console for details.');
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

  async function fetchAboutContent() {
    try {
      const { data } = await supabase
        .from('about_page_content')
        .select('*')
        .order('section, display_order');

      if (data && data.length > 0) {
        const sections = [];

        for (let i = 1; i <= 11; i++) {
          const sectionData: any = {};
          const sectionKey = `section_${i}`;

          const sectionContent = data.filter(item => item.section === sectionKey);
          sectionContent.forEach(item => {
            // Parse the value - it's stored as JSON string
            let value = item.value;
            if (typeof value === 'string' && value.startsWith('"')) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // If parse fails, use as is
              }
            }
            sectionData[item.key] = value;
          });

          sections.push(sectionData);
        }

        setAboutSections(sections);
        console.log('Loaded About sections from database:', sections);
      } else {
        console.log('No data found, using defaults');
        setAboutSections([
          {
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
            title: 'The Art of Locations™',
            subtitle: 'SGS Locations: Your Premier Destination for Exclusive Filming Locations in Dallas-Fort Worth',
            content: `For over 20 years, SGS Locations has been a leading provider of exclusive filming locations in the Dallas-Fort Worth metroplex.\n\nSGS Locations specializes in a wide range of productions, including commercials, television series, feature films, and still photography.\n\nOur dedicated team includes location scouts, photographers, permitting specialists, and production coordinators.`
          },
          {
            title: 'Discover Our Locations',
            content: "Whether you're looking for a sprawling ranch, modern architecture, historic properties, or urban settings, SGS Locations has the perfect backdrop for your production needs.",
            videoUrl: 'https://player.vimeo.com/video/616445043'
          },
          {
            title: 'Trusted by Major Productions',
            content: 'SGS Locations provides exclusive filming locations to the entertainment industry for motion picture, television, commercial, and print projects across the Dallas-Fort Worth area.',
            linkText: 'Learn More About Our Services →',
            linkUrl: '/search'
          },
          {
            image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
            title: 'Dallas Business Journal | SGS Locations Brings Professional Location Services to DFW',
            content: 'SGS Locations has been featured in the Dallas Business Journal for its innovative approach to connecting property owners with production companies.',
            linkText: 'Read Article →',
            linkUrl: '#'
          },
          {
            image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
            title: 'SGS Locations is a proud member of the Film Industry',
            content: 'We are committed to upholding the highest professional standards in the location services industry.'
          },
          {
            image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800',
            title: 'SGS Locations is in full compliance with the Texas Film Commission',
            content: 'As a licensed location service operating in Texas, we maintain full compliance with all Texas Film Commission regulations.'
          },
          {
            image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800',
            title: 'SGS Locations partners with DFWFC',
            content: 'We proudly partner with the Dallas-Fort Worth Film Commission to promote the region as a premier destination.',
            linkText: 'Visit DFWFC Website →',
            linkUrl: 'https://www.dfwfilmtx.com'
          },
          {
            image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800',
            title: 'Featured in Local Media Coverage',
            content: 'SGS Locations has been featured in numerous local media outlets for our role in bringing major productions to the Dallas-Fort Worth area.',
            linkText: 'View Media Coverage →',
            linkUrl: '#'
          },
          {
            image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800',
            title: 'Check out recent recognition we received:',
            content: 'SGS Locations has been recognized by the Dallas business community for excellence in location services.',
            linkText: 'Read More →',
            linkUrl: '#'
          },
          {
            image: 'https://images.unsplash.com/photo-1554224311-beee460c201f?w=800',
            title: 'Licensed & Insured',
            content: 'SGS Locations maintains all required business licenses and comprehensive insurance coverage.'
          },
          {
            title: 'Professional Filmmakers Code of Conduct',
            linkText: 'Professional Filmmakers Code of Conduct PDF',
            linkUrl: '/pdfs/code-of-conduct.pdf'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
    }
  }

  async function saveAllAboutContent() {
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];

      aboutSections.forEach((section, index) => {
        Object.keys(section).forEach(key => {
          if (section[key]) {
            promises.push(
              (async () => {
                const { error } = await supabase.from('about_page_content').upsert({
                  section: `section_${index + 1}`,
                  key: key,
                  value: JSON.stringify(section[key]),
                  type: 'text',
                  display_order: 0,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'section,key'
                });
                if (error) throw error;
              })()
            );
          }
        });
      });

      await Promise.all(promises);
      alert('About page content saved successfully!');
    } catch (error: any) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function fetchContactGrid() {
    try {
      const { data } = await supabase
        .from('contact_grid')
        .select('*')
        .order('position');

      if (data) {
        // Ensure we have all 24 positions
        const grid = [];
        for (let i = 1; i <= 24; i++) {
          const entry = data.find(d => d.position === i) || {
            position: i,
            entry_type: 'empty',
            image_url: null,
            name: null,
            title: null,
            email: null,
            company_name: null,
            external_url: null
          };
          grid.push(entry);
        }
        setContactGrid(grid);
      }
    } catch (error) {
      console.error('Error fetching contact grid:', error);
    }
  }

  async function saveContactGrid() {
    setSaving(true);
    try {
      const promises = contactGrid.map(entry => {
        return supabase
          .from('contact_grid')
          .upsert({
            position: entry.position,
            entry_type: entry.entry_type || 'empty',
            image_url: entry.image_url,
            name: entry.name,
            title: entry.title,
            email: entry.email,
            company_name: entry.company_name,
            external_url: entry.external_url,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'position'
          });
      });

      await Promise.all(promises);
      alert('Contact grid saved successfully!');
    } catch (error: any) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleContactImageUpload(position: number, file: File) {
    try {
      const url = await uploadImageToS3(file);
      const newGrid = [...contactGrid];
      newGrid[position - 1].image_url = url;
      setContactGrid(newGrid);
    } catch (error) {
      alert('Error uploading image');
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Content Management System</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
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
          <TabsTrigger value="contact">
            <Mail className="w-4 h-4 mr-2" />
            Contact
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
                  <Button onClick={() => {
                    setNewLogoForm(true);
                    setLogoImageFile(null);
                    setLogoImagePreview('');
                  }} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Logo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {newLogoForm && (
                  <div className="mb-4 p-4 border rounded bg-gray-50">
                    <h4 className="font-medium mb-3">Add New Production Logo</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Production Name</label>
                        <Input
                          placeholder="e.g. Yellowstone, Netflix"
                          id="new-logo-name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Logo Image</label>
                        {!logoImagePreview ? (
                          <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                            onClick={() => document.getElementById('logoImageUpload')?.click()}
                          >
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">
                              Click to upload logo image
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG or WebP (Recommended: 200x80px)
                            </p>
                            <input
                              id="logoImageUpload"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setLogoImageFile(file);
                                  setLogoImagePreview(URL.createObjectURL(file));
                                }
                              }}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={logoImagePreview}
                              alt="Logo preview"
                              className="w-full h-20 object-contain border rounded p-2"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLogoImageFile(null);
                                setLogoImagePreview('');
                              }}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={async () => {
                          const name = (document.getElementById('new-logo-name') as HTMLInputElement)?.value;

                          if (!name || !logoImageFile) {
                            alert('Please provide both name and logo image');
                            return;
                          }

                          setUploadingLogo(true);
                          try {
                            // Upload image to S3
                            const logoUrl = await uploadImageToS3(logoImageFile, 'production-logos');

                            // Save to database
                            const { error } = await supabase
                              .from('production_logos')
                              .insert([{
                                name,
                                logo_url: logoUrl,
                                logo_type: 'production',
                                display_order: productionLogos.length + 1,
                                is_active: true
                              }]);

                            if (error) throw error;

                            // Reset form and refresh
                            setNewLogoForm(false);
                            setLogoImageFile(null);
                            setLogoImagePreview('');
                            fetchAllContent();
                            alert('Logo added successfully!');
                          } catch (error: any) {
                            alert('Error adding logo: ' + error.message);
                          } finally {
                            setUploadingLogo(false);
                          }
                        }}
                      >
                        {uploadingLogo ? 'Uploading...' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productionLogos.map(logo => (
                    <div key={logo.id} className="border rounded p-4">
                      {editingLogo?.id === logo.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingLogo.name}
                            onChange={(e) => setEditingLogo({...editingLogo, name: e.target.value})}
                            placeholder="Production Name"
                          />

                          <div>
                            <p className="text-xs text-gray-600 mb-1">Current Logo:</p>
                            <img
                              src={editingLogo.logo_url}
                              alt={editingLogo.name}
                              className="h-10 object-contain mb-2"
                            />

                            {!editLogoPreview ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => document.getElementById(`editLogo-${logo.id}`)?.click()}
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Change Logo
                              </Button>
                            ) : (
                              <div className="relative">
                                <img
                                  src={editLogoPreview}
                                  alt="New preview"
                                  className="h-10 object-contain border rounded p-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditLogoFile(null);
                                    setEditLogoPreview('');
                                  }}
                                  className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <input
                              id={`editLogo-${logo.id}`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setEditLogoFile(file);
                                  setEditLogoPreview(URL.createObjectURL(file));
                                }
                              }}
                              className="hidden"
                            />
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              disabled={uploadingLogo}
                              onClick={async () => {
                                setUploadingLogo(true);
                                try {
                                  let logoUrl = editingLogo.logo_url;

                                  // If new image was selected, upload it
                                  if (editLogoFile) {
                                    logoUrl = await uploadImageToS3(editLogoFile, 'production-logos');
                                  }

                                  const { error } = await supabase
                                    .from('production_logos')
                                    .update({
                                      name: editingLogo.name,
                                      logo_url: logoUrl,
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq('id', logo.id);

                                  if (error) throw error;

                                  setEditingLogo(null);
                                  setEditLogoFile(null);
                                  setEditLogoPreview('');
                                  fetchAllContent();
                                  alert('Logo updated successfully!');
                                } catch (error: any) {
                                  alert('Error updating logo: ' + error.message);
                                } finally {
                                  setUploadingLogo(false);
                                }
                              }}
                            >
                              {uploadingLogo ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingLogo(null);
                                setEditLogoFile(null);
                                setEditLogoPreview('');
                              }}
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
                          <div className="flex space-x-1 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingLogo(logo);
                                setEditLogoFile(null);
                                setEditLogoPreview('');
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (!confirm(`Delete ${logo.name}?`)) return;

                                try {
                                  const { error } = await supabase
                                    .from('production_logos')
                                    .delete()
                                    .eq('id', logo.id);

                                  if (error) throw error;
                                  fetchAllContent();
                                } catch (error: any) {
                                  alert('Error deleting logo: ' + error.message);
                                }
                              }}
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
                <CardTitle>Our Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Loading services...</p>
                    <Button
                      variant="outline"
                      onClick={fetchAllContent}
                    >
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service, index) => {
                      const iconMap: { [key: string]: React.ReactNode } = {
                        'MapPin': <MapPin className="w-5 h-5" />,
                        'FileCheck': <FileCheck className="w-5 h-5" />,
                        'ImageIcon': <ImageIcon className="w-5 h-5" />
                      };

                      return (
                        <div key={service.id} className="border rounded-lg p-4 bg-gray-50">
                          {editingService?.id === service.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-[#e11921] rounded-full text-white">
                                  {iconMap[service.icon]}
                                </div>
                                <span className="text-sm text-gray-500">Service {index + 1}</span>
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-1">Service Title</label>
                                <Input
                                  value={editingService.title}
                                  onChange={(e) => setEditingService({...editingService, title: e.target.value})}
                                  placeholder="Service Title"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-1">Service Description</label>
                                <Textarea
                                  value={editingService.description}
                                  onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                                  placeholder="Service Description"
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('services')
                                        .update({
                                          title: editingService.title,
                                          description: editingService.description,
                                          updated_at: new Date().toISOString()
                                        })
                                        .eq('id', service.id);

                                      if (error) throw error;

                                      alert('Service updated successfully!');
                                      fetchAllContent();
                                      setEditingService(null);
                                    } catch (error: any) {
                                      alert('Error updating service: ' + error.message);
                                    }
                                  }}
                                >
                                  Save Changes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingService(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3 flex-1">
                                <div className="p-2 bg-[#e11921] rounded-full text-white flex-shrink-0">
                                  {iconMap[service.icon]}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-1">
                                    {service.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {service.description}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingService(service)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                      <p className="font-medium">Note:</p>
                      <p>The 3 services are fixed and can only be edited, not added or removed. Icons are predefined for each service.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FOOTER TAB */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Footer Content</CardTitle>
                <Button
                  onClick={saveFooterContent}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Social Media Links</CardTitle>
                <Button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const promises = socialLinks.map(link =>
                        supabase
                          .from('social_links')
                          .update({ url: link.url })
                          .eq('id', link.id)
                      );
                      await Promise.all(promises);
                      alert('Social links saved successfully!');
                    } catch (error) {
                      alert('Error saving social links');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Social Links'}
                </Button>
              </div>
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

        {/* CONTACT PAGE TAB */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contact Page Grid Management</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Manage the 24-slot grid (Team Members & Companies)</p>
                </div>
                <Button
                  onClick={saveContactGrid}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {contactGrid.map((entry, index) => (
                  <div key={entry.position} className="border rounded-lg p-3 bg-gray-50">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-500">Position {entry.position}</span>
                    </div>

                    {/* Entry Type Selector */}
                    <div className="mb-2">
                      <select
                        value={entry.entry_type || 'empty'}
                        onChange={(e) => {
                          const newGrid = [...contactGrid];
                          newGrid[index] = {
                            ...newGrid[index],
                            entry_type: e.target.value,
                            // Clear fields when changing type
                            name: null,
                            title: null,
                            email: null,
                            company_name: null,
                            external_url: null
                          };
                          setContactGrid(newGrid);
                        }}
                        className="w-full text-sm border rounded px-2 py-1"
                      >
                        <option value="empty">Empty Slot</option>
                        <option value="team">Team Member</option>
                        <option value="company">Company</option>
                      </select>
                    </div>

                    {entry.entry_type !== 'empty' && (
                      <>
                        {/* Image Upload */}
                        <div className="mb-2">
                          {entry.image_url && (
                            <img
                              src={entry.image_url}
                              alt={`Position ${entry.position}`}
                              className="w-full h-24 object-cover rounded mb-1"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/200x200?text=No+Image';
                              }}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById(`contact-img-${entry.position}`)?.click()}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            {entry.image_url ? 'Change' : 'Upload'}
                          </Button>
                          <input
                            id={`contact-img-${entry.position}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleContactImageUpload(entry.position, file);
                            }}
                          />
                        </div>

                        {/* Team Member Fields */}
                        {entry.entry_type === 'team' && (
                          <>
                            <Input
                              placeholder="Name"
                              value={entry.name || ''}
                              onChange={(e) => {
                                const newGrid = [...contactGrid];
                                newGrid[index].name = e.target.value;
                                setContactGrid(newGrid);
                              }}
                              className="mb-1 text-sm"
                            />
                            <Input
                              placeholder="Title"
                              value={entry.title || ''}
                              onChange={(e) => {
                                const newGrid = [...contactGrid];
                                newGrid[index].title = e.target.value;
                                setContactGrid(newGrid);
                              }}
                              className="mb-1 text-sm"
                            />
                            <Input
                              placeholder="Email"
                              type="email"
                              value={entry.email || ''}
                              onChange={(e) => {
                                const newGrid = [...contactGrid];
                                newGrid[index].email = e.target.value;
                                setContactGrid(newGrid);
                              }}
                              className="text-sm"
                            />
                          </>
                        )}

                        {/* Company Fields */}
                        {entry.entry_type === 'company' && (
                          <>
                            <Input
                              placeholder="Company Name"
                              value={entry.company_name || ''}
                              onChange={(e) => {
                                const newGrid = [...contactGrid];
                                newGrid[index].company_name = e.target.value;
                                setContactGrid(newGrid);
                              }}
                              className="mb-1 text-sm"
                            />
                            <Input
                              placeholder="External URL"
                              type="url"
                              value={entry.external_url || ''}
                              onChange={(e) => {
                                const newGrid = [...contactGrid];
                                newGrid[index].external_url = e.target.value;
                                setContactGrid(newGrid);
                              }}
                              className="text-sm"
                            />
                          </>
                        )}

                        {/* Clear Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-2 text-red-600"
                          onClick={() => {
                            const newGrid = [...contactGrid];
                            newGrid[index] = {
                              position: entry.position,
                              entry_type: 'empty',
                              image_url: null,
                              name: null,
                              title: null,
                              email: null,
                              company_name: null,
                              external_url: null
                            };
                            setContactGrid(newGrid);
                          }}
                        >
                          Clear Slot
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABOUT PAGE TAB */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>About Page Content Management</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Edit all 11 sections of the About page</p>
                </div>
                <Button
                  onClick={saveAllAboutContent}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
              {aboutSections.map((section, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3 text-lg">
                    Section {index + 1}
                    {index === 0 && ' - Main Hero Section'}
                    {index === 1 && ' - Video Section'}
                    {index === 2 && ' - Trusted by Major Productions (Centered)'}
                    {index === 3 && ' - Dallas Business Journal'}
                    {index === 4 && ' - Film Industry Member'}
                    {index === 5 && ' - Texas Film Commission'}
                    {index === 6 && ' - DFWFC Partnership'}
                    {index === 7 && ' - Media Coverage'}
                    {index === 8 && ' - Recent Recognition'}
                    {index === 9 && ' - Licensed & Insured'}
                    {index === 10 && ' - Code of Conduct (Centered)'}
                  </h4>

                  <div className="space-y-3">
                    {/* Image preview and upload for sections with images */}
                    {index !== 1 && index !== 2 && index !== 10 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Image</label>
                        {section?.image && (
                          <img
                            src={section.image}
                            alt={`Section ${index + 1}`}
                            className="w-full max-w-md h-48 object-cover rounded mb-2"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
                            }}
                          />
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById(`about-img-${index}`)?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {section?.image ? 'Change Image' : 'Upload Image'}
                        </Button>
                        <input
                          id={`about-img-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const url = await uploadImageToS3(file);
                                const newSections = [...aboutSections];
                                if (!newSections[index]) newSections[index] = {};
                                newSections[index].image = url;
                                setAboutSections(newSections);
                              } catch (error) {
                                alert('Error uploading image');
                              }
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Video preview and URL for section 2 */}
                    {index === 1 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Video Preview</label>
                        {section?.videoUrl && (
                          <div className="w-full max-w-md mb-2">
                            <div className="relative" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                src={section.videoUrl}
                                className="absolute top-0 left-0 w-full h-full rounded"
                                frameBorder="0"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium mb-1">Vimeo Video URL</label>
                          <Input
                            value={section?.videoUrl || ''}
                            onChange={(e) => {
                              const newSections = [...aboutSections];
                              if (!newSections[index]) newSections[index] = {};
                              newSections[index].videoUrl = e.target.value;
                              setAboutSections(newSections);
                            }}
                            placeholder="https://player.vimeo.com/video/..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Title field */}
                    {index !== 10 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input
                          value={section?.title || ''}
                          onChange={(e) => {
                            const newSections = [...aboutSections];
                            if (!newSections[index]) newSections[index] = {};
                            newSections[index].title = e.target.value;
                            setAboutSections(newSections);
                          }}
                          placeholder="Enter section title..."
                        />
                      </div>
                    )}

                    {/* Subtitle for section 1 */}
                    {index === 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Subtitle</label>
                        <Input
                          value={section?.subtitle || ''}
                          onChange={(e) => {
                            const newSections = [...aboutSections];
                            if (!newSections[index]) newSections[index] = {};
                            newSections[index].subtitle = e.target.value;
                            setAboutSections(newSections);
                          }}
                          placeholder="Enter subtitle..."
                        />
                      </div>
                    )}

                    {/* Content field with proper line breaks support */}
                    {index !== 10 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Content
                          <span className="text-xs text-gray-500 ml-2">(Use double line breaks for paragraphs)</span>
                        </label>
                        <Textarea
                          value={section?.content || ''}
                          onChange={(e) => {
                            const newSections = [...aboutSections];
                            if (!newSections[index]) newSections[index] = {};
                            newSections[index].content = e.target.value;
                            setAboutSections(newSections);
                          }}
                          rows={5}
                          placeholder="Enter section content..."
                          className="font-mono text-sm"
                        />
                      </div>
                    )}

                    {/* Link fields for sections that have them */}
                    {(index === 2 || index === 3 || index === 6 || index === 7 || index === 8 || index === 10) && (
                      <div className="border-t pt-3">
                        <h5 className="text-sm font-medium mb-2">Link Settings</h5>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Link Text</label>
                            <Input
                              value={section?.linkText || ''}
                              onChange={(e) => {
                                const newSections = [...aboutSections];
                                if (!newSections[index]) newSections[index] = {};
                                newSections[index].linkText = e.target.value;
                                setAboutSections(newSections);
                              }}
                              placeholder="e.g., Learn More →"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Link URL</label>
                            <Input
                              value={section?.linkUrl || ''}
                              onChange={(e) => {
                                const newSections = [...aboutSections];
                                if (!newSections[index]) newSections[index] = {};
                                newSections[index].linkUrl = e.target.value;
                                setAboutSections(newSections);
                              }}
                              placeholder="e.g., /search or https://..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
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
