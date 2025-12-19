'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, Globe, Home, Search, FileText, Settings, Video, MapPin, FileCheck, Image as ImageIcon, Mail, Info, Eye, ChevronDown, Phone, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImageToS3 } from '@/lib/s3-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

interface Project {
  id: string;
  name: string;
  banner_image: string;
  property_id: string;
  display_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FormQuestion {
  id: string;
  form_name: string;
  question_text: string;
  question_type: 'radio' | 'checkbox' | 'text';
  is_required: boolean;
  display_order: number;
  options: string[];
}

async function uploadVideoToS3(file: File): Promise<string> {
  try {
    // Step 1: Get presigned URL from your API
    const presignedResponse = await fetch('/api/upload-video-presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder: 'videos',
      }),
    });

    if (!presignedResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, publicUrl } = await presignedResponse.json();

    // Step 2: Upload directly to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to S3');
    }

    // Step 3: Return the public URL
    return publicUrl;
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
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string>('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string>('');

  // Home Page Content States
  const [heroMediaType, setHeroMediaType] = useState<'video' | 'photo'>('video');
  const [heroVideo, setHeroVideo] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [selectedHeroImageFile, setSelectedHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState('');
  const [productionLogos, setProductionLogos] = useState<ProductionLogo[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Footer Content States
  const [footerDescription, setFooterDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // About Page Content States
  const [aboutSections, setAboutSections] = useState<any[]>([]);
  const [uploadingVideoForSection, setUploadingVideoForSection] = useState<number | null>(null);

  // List Your Property Form Questions State
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null);

  // Terms & Conditions State
  const [termsContent, setTermsContent] = useState('');

  // Contact Page Grid States
  const [contactGrid, setContactGrid] = useState<any[]>([]);

  // General Contact Information States
  const [generalContactEmail, setGeneralContactEmail] = useState('');
  const [generalContactPhone, setGeneralContactPhone] = useState('');
  const [generalContactAddress, setGeneralContactAddress] = useState('');

  // Contact Form Questions State
  const [contactFormQuestions, setContactFormQuestions] = useState<any[]>([]);
  const [editingContactQuestion, setEditingContactQuestion] = useState<any | null>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  // Portfolio Visibility State
  const [portfolioVisible, setPortfolioVisible] = useState(true);

  // AI Photo Analysis State
  const [aiPhotoAnalysisEnabled, setAiPhotoAnalysisEnabled] = useState(false);

  // Property Footer States
  const [propertyFooterPhone, setPropertyFooterPhone] = useState('');
  const [propertyFooterPartnerText, setPropertyFooterPartnerText] = useState('');
  const [propertyFooterLicense, setPropertyFooterLicense] = useState('');
  const [propertyFooterCompanyName, setPropertyFooterCompanyName] = useState('');

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [newProjectForm, setNewProjectForm] = useState(false);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string>('');
  const [properties, setProperties] = useState<any[]>([]);
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [editPropertyDropdownOpen, setEditPropertyDropdownOpen] = useState(false);

  // Refs for click-outside detection
  const addPropertyDropdownRef = useRef<HTMLDivElement>(null);
  const editPropertyDropdownRef = useRef<HTMLDivElement>(null);

  // Edit States
  const [editingLogo, setEditingLogo] = useState<ProductionLogo | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newLogoForm, setNewLogoForm] = useState(false);

  useEffect(() => {
    fetchAllContent();
  }, []);

  // Click-outside detection for add property dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addPropertyDropdownRef.current && !addPropertyDropdownRef.current.contains(event.target as Node)) {
        setIsPropertyDropdownOpen(false);
        setPropertySearchQuery('');
      }
    }

    if (isPropertyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isPropertyDropdownOpen]);

  // Click-outside detection for edit property dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editPropertyDropdownRef.current && !editPropertyDropdownRef.current.contains(event.target as Node)) {
        setEditPropertyDropdownOpen(false);
        setPropertySearchQuery('');
      }
    }

    if (editPropertyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editPropertyDropdownOpen]);

  useEffect(() => {
    if (activeTab === 'contact') {
      fetchContactGrid();
      fetchGeneralContactInfo();
      fetchContactFormQuestions();
    } else if (activeTab === 'portfolio') {
      fetchPortfolioVisibility();
      fetchProjects();
      fetchProperties();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'about' && aboutSections.length === 0) {
      fetchAboutContent();
    }
  }, [activeTab, aboutSections.length]);

  useEffect(() => {
    if (activeTab === 'list-property' && formQuestions.length === 0) {
      fetchFormQuestions();
    }
  }, [activeTab, formQuestions.length]);

  useEffect(() => {
    if (activeTab === 'other') {
      fetchTermsAndConditions();
      fetchAiPhotoAnalysisSetting();
    }
  }, [activeTab]);

  async function fetchAllContent() {
    setLoading(true);
    try {
      // Test admin authentication first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current user:', user?.email, 'User error:', userError);

      if (!user || !session) {
        console.error('No authenticated user found');
        alert('Please log in as an admin to access this page.');
        setLoading(false);
        return;
      }

      // Check admin status - use directFetch with auth token
      const { directFetch } = await import('@/lib/supabase');
      const { data: adminData, error: adminError } = await directFetch('admins', {
        select: '*',
        eq: { email: user?.email || '' },
        single: true,
        authToken: session.access_token
      });

      console.log('Admin status:', adminData, 'Admin error:', adminError);

      if (adminError || !adminData) {
        console.error('User is not an admin:', user.email, 'Error:', adminError);
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
        settings.forEach((setting: any) => {
          // Parse the JSON value properly - handle multiple layers of escaping
          let value = setting.value;
          if (typeof value === 'string') {
            try {
              // Keep parsing until we get a plain string
              while (typeof value === 'string' && (value.startsWith('"') || value.startsWith('\\"'))) {
                value = JSON.parse(value);
              }
            } catch (e) {
              // If parsing fails, just remove outer quotes
              value = value.replace(/^"|"$/g, '');
            }
          }

          switch(setting.key) {
            case 'hero_media_type': setHeroMediaType(value as 'video' | 'photo'); break;
            case 'hero_video': setHeroVideo(value); break;
            case 'hero_image': setHeroImage(value); break;
            case 'hero_title': setHeroTitle(value); break;
            case 'hero_subtitle': setHeroSubtitle(value); break;
            case 'footer_description': setFooterDescription(value); break;
            case 'contact_phone': setContactPhone(value); break;
            case 'contact_email': setContactEmail(value); break;
            case 'contact_address': setContactAddress(value); break;
            case 'office_hours': setOfficeHours(value); break;
            case 'property_footer_phone': setPropertyFooterPhone(value); break;
            case 'property_footer_partner_text': setPropertyFooterPartnerText(value); break;
            case 'property_footer_license': setPropertyFooterLicense(value); break;
            case 'property_footer_company_name': setPropertyFooterCompanyName(value); break;
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
      console.log(`Saving site setting: ${key} = ${value} (page: ${page}, section: ${section})`);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${session.access_token}`,
      };

      const settingData = {
        key,
        value: JSON.stringify(value),
        page,
        section,
        updated_at: new Date().toISOString()
      };

      console.log('Setting data:', settingData);

      // Try to update first
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/site_settings?key=eq.${encodeURIComponent(key)}`,
        {
          method: 'PATCH',
          headers: {
            ...headers,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            value: settingData.value,
            page: settingData.page,
            section: settingData.section,
            updated_at: settingData.updated_at
          }),
        }
      );

      if (updateResponse.ok) {
        const result = await updateResponse.json();
        if (result && result.length > 0) {
          console.log(`Successfully updated ${key}`);
          return;
        }
      }

      // If update didn't affect any rows, insert new record
      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/site_settings`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(settingData),
        }
      );

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error(`Failed to save ${key}:`, errorText);
        throw new Error(`Failed to save ${key}: ${errorText}`);
      }

      console.log(`Successfully inserted ${key}`);
    } catch (error: any) {
      console.error(`Error in saveSiteSetting for ${key}:`, error);
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

  async function handleHeroImageUpload() {
    if (!selectedHeroImageFile) return;

    setUploadingHeroImage(true);
    try {
      const imageUrl = await uploadImageToS3(selectedHeroImageFile, 'hero');
      await saveSiteSetting('hero_image', imageUrl, 'home', 'hero');
      setHeroImage(imageUrl);
      setSelectedHeroImageFile(null);
      setHeroImagePreview('');
      alert('Hero image uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading hero image:', error);
      alert('Error uploading image');
    } finally {
      setUploadingHeroImage(false);
    }
  }

  async function saveAllHomeContent() {
    setSaving(true);
    try {
      // Save all home page settings
      await Promise.all([
        saveSiteSetting('hero_media_type', heroMediaType, 'home', 'hero'),
        saveSiteSetting('hero_video', heroVideo, 'home', 'hero'),
        saveSiteSetting('hero_image', heroImage, 'home', 'hero'),
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
      console.log('Saving footer content...');
      await Promise.all([
        saveSiteSetting('footer_description', footerDescription, 'global', 'footer'),
        saveSiteSetting('contact_phone', contactPhone, 'global', 'footer'),
        saveSiteSetting('contact_email', contactEmail, 'global', 'footer'),
        saveSiteSetting('contact_address', contactAddress, 'global', 'footer'),
        saveSiteSetting('office_hours', officeHours, 'global', 'footer'),
      ]);
      alert('Footer content saved successfully!');
    } catch (error: any) {
      console.error('Error saving footer content:', error);
      alert(`Error saving footer content: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  async function savePropertyFooterContent() {
    setSaving(true);
    try {
      await Promise.all([
        saveSiteSetting('property_footer_phone', propertyFooterPhone, 'property', 'footer'),
        saveSiteSetting('property_footer_partner_text', propertyFooterPartnerText, 'property', 'footer'),
        saveSiteSetting('property_footer_license', propertyFooterLicense, 'property', 'footer'),
        saveSiteSetting('property_footer_company_name', propertyFooterCompanyName, 'property', 'footer'),
      ]);
      alert('Property footer content saved successfully!');
    } catch (error) {
      alert('Error saving property footer content');
    } finally {
      setSaving(false);
    }
  }

  async function addProductionLogo(logo: Partial<ProductionLogo>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/production_logos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          ...logo,
          display_order: productionLogos.length + 1
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      fetchAllContent();
      setNewLogoForm(false);
    } catch (error: any) {
      alert('Error adding logo: ' + error.message);
    }
  }

  async function updateProductionLogo(id: string, updates: Partial<ProductionLogo>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/production_logos?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      fetchAllContent();
      setEditingLogo(null);
    } catch (error: any) {
      alert('Error updating logo: ' + error.message);
    }
  }

  async function deleteProductionLogo(id: string) {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/production_logos?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      fetchAllContent();
    } catch (error: any) {
      alert('Error deleting logo: ' + error.message);
    }
  }


  async function updateSocialLink(id: string, url: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/social_links?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          url,
          is_active: url ? true : false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

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

          const sectionContent = (data as any[]).filter((item: any) => item.section === sectionKey);
          sectionContent.forEach((item: any) => {
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
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
            title: 'The Art of Locations™',
            subtitle: 'SGS Locations: Your Premier Destination for Exclusive Filming Locations in Dallas-Fort Worth',
            content: `For over 20 years, SGS Locations has been a leading provider of exclusive filming locations in the Dallas-Fort Worth metroplex.\n\nSGS Locations specializes in a wide range of productions, including commercials, television series, feature films, and still photography.\n\nOur dedicated team includes location scouts, photographers, permitting specialists, and production coordinators.`
          },
          {
            mediaType: 'video',
            title: 'Discover Our Locations',
            content: "Whether you're looking for a sprawling ranch, modern architecture, historic properties, or urban settings, SGS Locations has the perfect backdrop for your production needs.",
            videoUrl: ''
          },
          {
            mediaType: 'none',
            title: 'Trusted by Major Productions',
            content: 'SGS Locations provides exclusive filming locations to the entertainment industry for motion picture, television, commercial, and print projects across the Dallas-Fort Worth area.',
            linkText: 'Learn More About Our Services →',
            linkUrl: '/search'
          },
          {
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
            title: 'Dallas Business Journal | SGS Locations Brings Professional Location Services to DFW',
            content: 'SGS Locations has been featured in the Dallas Business Journal for its innovative approach to connecting property owners with production companies.',
            linkText: 'Read Article →',
            linkUrl: '#'
          },
          {
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
            title: 'SGS Locations is a proud member of the Film Industry',
            content: 'We are committed to upholding the highest professional standards in the location services industry.'
          },
          {
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800',
            title: 'SGS Locations is in full compliance with the Texas Film Commission',
            content: 'As a licensed location service operating in Texas, we maintain full compliance with all Texas Film Commission regulations.'
          },
          {
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800',
            title: 'SGS Locations partners with DFWFC',
            content: 'We proudly partner with the Dallas-Fort Worth Film Commission to promote the region as a premier destination.',
            linkText: 'Visit DFWFC Website →',
            linkUrl: 'https://www.dfwfilmtx.com'
          },
          {
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800',
            title: 'Featured in Local Media Coverage',
            content: 'SGS Locations has been featured in numerous local media outlets for our role in bringing major productions to the Dallas-Fort Worth area.',
            linkText: 'View Media Coverage →',
            linkUrl: '#'
          },
          {
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800',
            title: 'Check out recent recognition we received:',
            content: 'SGS Locations has been recognized by the Dallas business community for excellence in location services.',
            linkText: 'Read More →',
            linkUrl: '#'
          },
          {
            mediaType: 'image',
            image: 'https://images.unsplash.com/photo-1554224311-beee460c201f?w=800',
            title: 'Licensed & Insured',
            content: 'SGS Locations maintains all required business licenses and comprehensive insurance coverage.'
          },
          {
            mediaType: 'none',
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

  function deleteAboutSection(indexToDelete: number) {
    const confirmDelete = window.confirm(`Are you sure you want to delete Section ${indexToDelete + 1}? This action cannot be undone.`);
    if (!confirmDelete) return;

    const newSections = aboutSections.filter((_, index) => index !== indexToDelete);
    setAboutSections(newSections);
  }

  function addAboutSection() {
    const newSection = {
      mediaType: 'image',
      title: '',
      content: '',
      image: ''
    };
    setAboutSections([...aboutSections, newSection]);
  }

  async function handleAboutVideoUpload(file: File, sectionIndex: number) {
    setUploadingVideoForSection(sectionIndex);
    try {
      const videoUrl = await uploadVideoToS3(file);
      const newSections = [...aboutSections];
      if (!newSections[sectionIndex]) newSections[sectionIndex] = {};
      newSections[sectionIndex].videoUrl = videoUrl;
      setAboutSections(newSections);
      alert('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video. Please try again.');
    } finally {
      setUploadingVideoForSection(null);
    }
  }

  async function saveAllAboutContent() {
    setSaving(true);
    try {
      // First, delete all existing about_page_content entries
      await (supabase.from('about_page_content') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const promises: Promise<any>[] = [];

      aboutSections.forEach((section, index) => {
        Object.keys(section).forEach(key => {
          if (section[key]) {
            promises.push(
              (async () => {
                const { error } = await (supabase.from('about_page_content') as any).upsert({
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

  // List Your Property Form Questions Functions
  async function fetchFormQuestions() {
    try {
      const response = await fetch('/api/form-questions?form_name=list_your_property');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch form questions');
      }

      if (result.data) {
        setFormQuestions(result.data.map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        })));
      }
    } catch (error) {
      console.error('Error fetching form questions:', error);
    }
  }

  async function saveFormQuestion(question: FormQuestion) {
    setSaving(true);
    try {
      const response = await fetch('/api/form-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: question.id,
          form_name: 'list_your_property',
          question_text: question.question_text,
          question_type: question.question_type,
          is_required: question.is_required,
          display_order: question.display_order,
          options: question.options
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save form question');
      }

      await fetchFormQuestions();
      setEditingQuestion(null);
      alert('Question saved successfully!');
    } catch (error: any) {
      alert('Error saving question: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFormQuestion(id: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/form-questions?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete form question');
      }

      await fetchFormQuestions();
      alert('Question deleted successfully!');
    } catch (error: any) {
      alert('Error deleting question: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function addNewQuestion() {
    const newQuestion: FormQuestion = {
      id: crypto.randomUUID(),
      form_name: 'list_your_property',
      question_text: '',
      question_type: 'radio',
      is_required: true,
      display_order: formQuestions.length + 1,
      options: []
    };
    setEditingQuestion(newQuestion);
  }

  function addOption(question: FormQuestion) {
    const updatedQuestion = {
      ...question,
      options: [...question.options, '']
    };
    setEditingQuestion(updatedQuestion);
  }

  function updateOption(question: FormQuestion, index: number, value: string) {
    const updatedOptions = [...question.options];
    updatedOptions[index] = value;
    setEditingQuestion({
      ...question,
      options: updatedOptions
    });
  }

  function removeOption(question: FormQuestion, index: number) {
    const updatedOptions = question.options.filter((_, i) => i !== index);
    setEditingQuestion({
      ...question,
      options: updatedOptions
    });
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
          const entry = (data as any[]).find((d: any) => d.position === i) || {
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

  async function fetchGeneralContactInfo() {
    try {
      const { data: settings } = await (supabase
        .from('site_settings') as any)
        .select('*')
        .in('key', ['general_contact_email', 'general_contact_phone', 'general_contact_address']);

      if (settings) {
        const parseValue = (value: any): string => {
          if (!value) return '';
          if (typeof value === 'string') {
            try {
              let parsed = value;
              while (typeof parsed === 'string' && (parsed.startsWith('"') || parsed.startsWith('\\"'))) {
                parsed = JSON.parse(parsed);
              }
              return parsed;
            } catch (e) {
              return value.replace(/^"|"$/g, '');
            }
          }
          return String(value);
        };

        const email = (settings as any[]).find((s: any) => s.key === 'general_contact_email')?.value;
        const phone = (settings as any[]).find((s: any) => s.key === 'general_contact_phone')?.value;
        const address = (settings as any[]).find((s: any) => s.key === 'general_contact_address')?.value;

        setGeneralContactEmail(parseValue(email) || 'paul@imagelocations.com');
        setGeneralContactPhone(parseValue(phone) || '(310) 871-8004');
        setGeneralContactAddress(parseValue(address) || '9663 Santa Monica Blvd. Suite 842,\nBeverly Hills, CA 90210');
      }
    } catch (error) {
      console.error('Error fetching general contact info:', error);
    }
  }

  async function fetchContactFormQuestions() {
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        return;
      }

      // Use directFetch to get questions
      const { directFetch } = await import('@/lib/supabase');
      const { data: questions } = await directFetch('contact_form_questions', {
        select: '*',
        order: 'display_order',
        authToken: session.access_token
      });

      if (questions && Array.isArray(questions)) {
        // Fetch options for each question
        const questionsWithOptions = await Promise.all(
          questions.map(async (q: any) => {
            const { data: options } = await directFetch('contact_form_question_options', {
              select: 'id,option_value,option_label,display_order',
              eq: { question_id: q.id },
              order: 'display_order',
              authToken: session.access_token
            });

            return {
              ...q,
              options: options || []
            };
          })
        );

        setContactFormQuestions(questionsWithOptions);
      }
    } catch (error) {
      console.error('Error fetching contact form questions:', error);
    }
  }

  async function addContactFormQuestion() {
    if (!newQuestionText.trim()) {
      alert('Please enter a question text');
      return;
    }

    if (contactFormQuestions.length >= 2) {
      alert('Maximum 2 questions allowed. Please delete one first.');
      return;
    }

    setSaving(true);
    try {
      const fieldName = newQuestionText.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const displayOrder = contactFormQuestions.length + 1;

      const { data, error } = await (supabase
        .from('contact_form_questions') as any)
        .insert({
          question_text: newQuestionText,
          field_name: fieldName,
          is_required: newQuestionRequired,
          display_order: displayOrder
        })
        .select()
        .single();

      if (error) throw error;

      setNewQuestionText('');
      setNewQuestionRequired(true);
      await fetchContactFormQuestions();
      alert('Question added successfully!');
    } catch (error: any) {
      alert('Error adding question: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateContactFormQuestion(questionId: string, updates: any) {
    setSaving(true);
    try {
      const { error } = await (supabase
        .from('contact_form_questions') as any)
        .update(updates)
        .eq('id', questionId);

      if (error) throw error;

      await fetchContactFormQuestions();
      alert('Question updated successfully!');
    } catch (error: any) {
      alert('Error updating question: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteContactFormQuestion(questionId: string) {
    if (!confirm('Are you sure you want to delete this question? This will also delete all its options.')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase
        .from('contact_form_questions') as any)
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      await fetchContactFormQuestions();
      alert('Question deleted successfully!');
    } catch (error: any) {
      alert('Error deleting question: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function addQuestionOption(questionId: string, optionLabel: string) {
    if (!optionLabel.trim()) {
      alert('Please enter an option label');
      return;
    }

    setSaving(true);
    try {
      const question = contactFormQuestions.find(q => q.id === questionId);
      const displayOrder = (question?.options?.length || 0) + 1;

      // Auto-generate value from label
      const optionValue = optionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { error } = await (supabase
        .from('contact_form_question_options') as any)
        .insert({
          question_id: questionId,
          option_value: optionValue,
          option_label: optionLabel,
          display_order: displayOrder
        });

      if (error) throw error;

      await fetchContactFormQuestions();
    } catch (error: any) {
      alert('Error adding option: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateQuestionOption(optionId: string, optionLabel: string) {
    setSaving(true);
    try {
      // Auto-generate value from label
      const optionValue = optionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { error } = await (supabase
        .from('contact_form_question_options') as any)
        .update({
          option_label: optionLabel,
          option_value: optionValue
        })
        .eq('id', optionId);

      if (error) throw error;

      await fetchContactFormQuestions();
    } catch (error: any) {
      alert('Error updating option: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestionOption(optionId: string) {
    if (!confirm('Delete this option?')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase
        .from('contact_form_question_options') as any)
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      await fetchContactFormQuestions();
    } catch (error: any) {
      alert('Error deleting option: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveGeneralContactInfo() {
    setSaving(true);
    try {
      const settings = [
        { key: 'general_contact_email', value: generalContactEmail },
        { key: 'general_contact_phone', value: generalContactPhone },
        { key: 'general_contact_address', value: generalContactAddress },
      ];

      for (const setting of settings) {
        const { error } = await (supabase
          .from('site_settings') as any)
          .upsert({
            key: setting.key,
            value: JSON.stringify(setting.value),
            page: 'contact',
            section: 'general',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      alert('General contact information saved successfully!');
    } catch (error: any) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveContactGrid() {
    setSaving(true);
    try {
      const promises = contactGrid.map(entry => {
        return (supabase
          .from('contact_grid') as any)
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

  async function fetchPortfolioVisibility() {
    try {
      const { data } = await (supabase
        .from('site_settings') as any)
        .select('value')
        .eq('key', 'portfolio_visible')
        .maybeSingle();

      if (data && data.value) {
        const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setPortfolioVisible(value === true || value === 'true');
      }
    } catch (error) {
      console.error('Error fetching portfolio visibility:', error);
    }
  }

  async function savePortfolioVisibility() {
    setSaving(true);
    try {
      const { error } = await (supabase
        .from('site_settings') as any)
        .upsert({
          key: 'portfolio_visible',
          value: JSON.stringify(portfolioVisible),
          page: 'portfolio',
          section: 'visibility',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      alert('Portfolio visibility updated successfully!');
    } catch (error: any) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, real_name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      if (data) setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  }

  async function addProject(project: Partial<Project>) {
    try {
      const { error } = await (supabase
        .from('projects') as any)
        .insert([{
          ...project,
          display_order: projects.length + 1,
          status: 'active'
        }]);

      if (error) throw error;
      fetchProjects();
      setNewProjectForm(false);
      setProjectImageFile(null);
      setProjectImagePreview('');
      alert('Project added successfully!');
    } catch (error: any) {
      alert('Error adding project: ' + error.message);
    }
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    try {
      console.log('Updating project:', id, 'with data:', updates);

      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('No active session. Please log in again.');
        return;
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Use REST API directly with admin auth token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/projects?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error(errorText);
      }

      const data = await response.json();
      console.log('Update successful:', data);

      await fetchProjects();
      setEditingProject(null);
      setProjectImageFile(null);
      setProjectImagePreview('');
      alert('Project updated successfully!');
    } catch (error: any) {
      console.error('Error in updateProject:', error);
      alert('Error updating project: ' + error.message);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await (supabase
        .from('projects') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProjects();
      alert('Project deleted successfully!');
    } catch (error: any) {
      alert('Error deleting project: ' + error.message);
    }
  }

  async function fetchAiPhotoAnalysisSetting() {
    try {
      const { data } = await (supabase
        .from('site_settings') as any)
        .select('value')
        .eq('key', 'ai_photo_analysis_enabled')
        .maybeSingle();

      if (data && data.value !== null && data.value !== undefined) {
        const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setAiPhotoAnalysisEnabled(value === true || value === 'true');
      } else {
        // Default to false if setting doesn't exist
        setAiPhotoAnalysisEnabled(false);
      }
    } catch (error) {
      console.error('Error fetching AI photo analysis setting:', error);
      setAiPhotoAnalysisEnabled(false); // Default to false on error
    }
  }

  async function saveAiPhotoAnalysisSetting() {
    setSaving(true);
    try {
      const { error } = await (supabase
        .from('site_settings') as any)
        .upsert({
          key: 'ai_photo_analysis_enabled',
          value: JSON.stringify(aiPhotoAnalysisEnabled),
          page: 'admin',
          section: 'settings',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      alert('AI Photo Analysis setting updated successfully!');
    } catch (error: any) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function fetchTermsAndConditions() {
    try {
      const { data } = await supabase
        .from('terms_and_conditions')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setTermsContent((data as any).content);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  }

  async function saveTermsAndConditions() {
    setSaving(true);
    try {
      // Get the current max version number
      const { data: maxVersionData } = await (supabase
        .from('terms_and_conditions') as any)
        .select('version')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Increment version number (or start at 1 if no existing versions)
      const newVersion = maxVersionData ? (maxVersionData.version + 1) : 1;

      // Deactivate old versions
      await (supabase
        .from('terms_and_conditions') as any)
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new version
      const { error } = await (supabase
        .from('terms_and_conditions') as any)
        .insert({
          content: termsContent,
          version: newVersion,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh the terms to show the updated content
      await fetchTermsAndConditions();

      alert('Terms and Conditions updated successfully!');
    } catch (error: any) {
      console.error('Error saving terms:', error);
      alert('Error saving terms: ' + (error.message || JSON.stringify(error)));
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
        <TabsList className="grid w-full grid-cols-8 mb-6">
          <TabsTrigger value="home">
            <Home className="w-4 h-4 mr-2" />
            Home Page
          </TabsTrigger>
          <TabsTrigger value="about">
            <Info className="w-4 h-4 mr-2" />
            About Page
          </TabsTrigger>
          <TabsTrigger value="portfolio">
            <ImageIcon className="w-4 h-4 mr-2" />
            Portfolio
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
            <Home className="w-4 h-4 mr-2" />
            Property Page
          </TabsTrigger>
          <TabsTrigger value="list-property">
            <ClipboardList className="w-4 h-4 mr-2" />
            List Property
          </TabsTrigger>
          <TabsTrigger value="other">
            <FileText className="w-4 h-4 mr-2" />
            T&C
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
                {/* Media Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Hero Media Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="heroMediaType"
                        value="video"
                        checked={heroMediaType === 'video'}
                        onChange={(e) => setHeroMediaType(e.target.value as 'video' | 'photo')}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm">Video</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="heroMediaType"
                        value="photo"
                        checked={heroMediaType === 'photo'}
                        onChange={(e) => setHeroMediaType(e.target.value as 'video' | 'photo')}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm">Photo</span>
                    </label>
                  </div>
                </div>

                {/* Video Upload Section */}
                {heroMediaType === 'video' && (
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
                )}

                {/* Photo Upload Section */}
                {heroMediaType === 'photo' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Hero Photo</label>
                    {heroImage && !heroImagePreview && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-2">Current Image:</p>
                        <img src={heroImage} alt="Current hero" className="max-w-md h-48 object-cover rounded border" />
                      </div>
                    )}
                    {heroImagePreview && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-2">Preview:</p>
                        <img src={heroImagePreview} alt="Preview" className="max-w-md h-48 object-cover rounded border" />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => document.getElementById('heroImageUpload')?.click()}
                        disabled={uploadingHeroImage}
                        variant="outline"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingHeroImage ? 'Uploading...' : 'Choose Image'}
                      </Button>
                      <input
                        id="heroImageUpload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedHeroImageFile(file);
                            setHeroImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                      {selectedHeroImageFile && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleHeroImageUpload} disabled={uploadingHeroImage}>
                            {uploadingHeroImage ? 'Uploading...' : 'Confirm Upload'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedHeroImageFile(null);
                              setHeroImagePreview('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP format. Recommended size: 1920x1080px or larger</p>
                  </div>
                )}

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
                            const { error } = await (supabase
                              .from('production_logos') as any)
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

                                  const { error } = await (supabase
                                    .from('production_logos') as any)
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
                                  const { error } = await (supabase
                                    .from('production_logos') as any)
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
                                      const { error } = await (supabase
                                        .from('services') as any)
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

        {/* PORTFOLIO TAB */}
        <TabsContent value="portfolio" className="space-y-6">
          {/* Portfolio Visibility Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Portfolio Page Visibility</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Control whether the Portfolio link appears in the navigation menu</p>
                </div>
                <Button
                  onClick={savePortfolioVisibility}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Show Portfolio in Navigation</h3>
                  <p className="text-sm text-gray-600">
                    When enabled, the Portfolio link will appear in the main navigation menu.
                    When disabled, users won't be able to access the portfolio page from the menu.
                  </p>
                </div>
                <button
                  onClick={() => setPortfolioVisible(!portfolioVisible)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    portfolioVisible ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      portfolioVisible ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current Status:</strong> Portfolio page is {portfolioVisible ? 'visible' : 'hidden'} in the navigation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Projects Management Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Portfolio Projects</CardTitle>
                <Button onClick={() => {
                  setNewProjectForm(true);
                  setProjectImageFile(null);
                  setProjectImagePreview('');
                  setPropertySearchQuery('');
                  setSelectedPropertyId('');
                  setIsPropertyDropdownOpen(false);
                }} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {newProjectForm && (
                <div className="mb-6 p-4 border rounded bg-gray-50">
                  <h4 className="font-medium mb-3">Add New Project</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Project Name</label>
                      <Input
                        placeholder="e.g. Selena Gomez - Vanity Fair - Hermosa House"
                        id="new-project-name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Property</label>
                      <div className="relative" ref={addPropertyDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                          className="w-full border rounded px-3 py-2 text-sm text-left flex items-center justify-between bg-white hover:bg-gray-50"
                        >
                          <span className={selectedPropertyId ? 'text-black' : 'text-gray-500'}>
                            {selectedPropertyId
                              ? properties.find(p => p.id === selectedPropertyId)?.real_name || properties.find(p => p.id === selectedPropertyId)?.name || 'Select a property...'
                              : 'Select a property...'
                            }
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {isPropertyDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
                            <div className="p-2 border-b sticky top-0 bg-white">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  placeholder="Search properties..."
                                  value={propertySearchQuery}
                                  onChange={(e) => setPropertySearchQuery(e.target.value)}
                                  className="pl-8 text-sm"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-64">
                              {properties
                                .filter(prop => {
                                  if (!propertySearchQuery) return true;
                                  const query = propertySearchQuery.toLowerCase();
                                  const name = (prop.real_name || prop.name || '').toLowerCase();
                                  return name.includes(query);
                                })
                                .map(prop => (
                                  <button
                                    key={prop.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPropertyId(prop.id);
                                      setIsPropertyDropdownOpen(false);
                                      setPropertySearchQuery('');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                                  >
                                    {prop.real_name || prop.name}
                                  </button>
                                ))
                              }
                              {properties.filter(prop => {
                                if (!propertySearchQuery) return true;
                                const query = propertySearchQuery.toLowerCase();
                                const name = (prop.real_name || prop.name || '').toLowerCase();
                                return name.includes(query);
                              }).length === 0 && (
                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                  No properties found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Banner Image</label>
                      {!projectImagePreview ? (
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                          onClick={() => document.getElementById('projectImageUpload')?.click()}
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Click to upload banner image</p>
                          <input
                            id="projectImageUpload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProjectImageFile(file);
                                setProjectImagePreview(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={projectImagePreview}
                            alt="Preview"
                            className="w-full h-40 object-cover border rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProjectImageFile(null);
                              setProjectImagePreview('');
                            }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
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
                        const name = (document.getElementById('new-project-name') as HTMLInputElement)?.value;

                        if (!name || !selectedPropertyId || !projectImageFile) {
                          alert('Please provide project name, property, and banner image');
                          return;
                        }

                        setUploadingLogo(true);
                        try {
                          const bannerUrl = await uploadImageToS3(projectImageFile, 'projects');
                          await addProject({
                            name,
                            property_id: selectedPropertyId,
                            banner_image: bannerUrl
                          });
                          setSelectedPropertyId('');
                        } catch (error: any) {
                          alert('Error adding project: ' + error.message);
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
                        setNewProjectForm(false);
                        setProjectImageFile(null);
                        setProjectImagePreview('');
                        setPropertySearchQuery('');
                        setSelectedPropertyId('');
                        setIsPropertyDropdownOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="border rounded p-4">
                    {editingProject?.id === project.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingProject.name}
                          onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                          placeholder="Project Name"
                        />
                        <div className="relative" ref={editPropertyDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setEditPropertyDropdownOpen(!editPropertyDropdownOpen)}
                            className="w-full border rounded px-3 py-2 text-sm text-left flex items-center justify-between bg-white hover:bg-gray-50"
                          >
                            <span className="text-black">
                              {properties.find(p => p.id === editingProject.property_id)?.real_name ||
                               properties.find(p => p.id === editingProject.property_id)?.name ||
                               'Select a property...'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </button>

                          {editPropertyDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
                              <div className="p-2 border-b sticky top-0 bg-white">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    placeholder="Search properties..."
                                    value={propertySearchQuery}
                                    onChange={(e) => setPropertySearchQuery(e.target.value)}
                                    className="pl-8 text-sm"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="overflow-y-auto max-h-64">
                                {properties
                                  .filter(prop => {
                                    if (!propertySearchQuery) return true;
                                    const query = propertySearchQuery.toLowerCase();
                                    const name = (prop.real_name || prop.name || '').toLowerCase();
                                    return name.includes(query);
                                  })
                                  .map(prop => (
                                    <button
                                      key={prop.id}
                                      type="button"
                                      onClick={() => {
                                        setEditingProject({...editingProject, property_id: prop.id});
                                        setEditPropertyDropdownOpen(false);
                                        setPropertySearchQuery('');
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                                    >
                                      {prop.real_name || prop.name}
                                    </button>
                                  ))
                                }
                                {properties.filter(prop => {
                                  if (!propertySearchQuery) return true;
                                  const query = propertySearchQuery.toLowerCase();
                                  const name = (prop.real_name || prop.name || '').toLowerCase();
                                  return name.includes(query);
                                }).length === 0 && (
                                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                    No properties found
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">{projectImagePreview ? 'New Image:' : 'Current Image:'}</p>
                          {!projectImagePreview ? (
                            <>
                              <img
                                src={editingProject.banner_image}
                                alt={editingProject.name}
                                className="w-full h-32 object-cover rounded mb-2"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => document.getElementById(`editProject-${project.id}`)?.click()}
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Change Image
                              </Button>
                            </>
                          ) : (
                            <div className="relative">
                              <img
                                src={projectImagePreview}
                                alt="New preview"
                                className="w-full h-32 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setProjectImageFile(null);
                                  setProjectImagePreview('');
                                }}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <input
                            id={`editProject-${project.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProjectImageFile(file);
                                setProjectImagePreview(URL.createObjectURL(file));
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
                                let bannerUrl = editingProject.banner_image;
                                if (projectImageFile) {
                                  bannerUrl = await uploadImageToS3(projectImageFile, 'projects');
                                }
                                await updateProject(project.id, {
                                  name: editingProject.name,
                                  property_id: editingProject.property_id,
                                  banner_image: bannerUrl
                                });
                              } catch (error: any) {
                                alert('Error updating project: ' + error.message);
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
                              setEditingProject(null);
                              setProjectImageFile(null);
                              setProjectImagePreview('');
                              setPropertySearchQuery('');
                              setEditPropertyDropdownOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : viewingProject?.id === project.id ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-base">Project Details</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingProject(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div>
                          <img
                            src={project.banner_image}
                            alt={project.name}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Project Name</p>
                            <p className="text-sm font-medium">{project.name}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Property</p>
                            <p className="text-sm">{properties.find(p => p.id === project.property_id)?.real_name || properties.find(p => p.id === project.property_id)?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Property ID</p>
                            <p className="text-sm font-mono text-xs">{project.property_id}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                            <p className="text-sm capitalize">{project.status}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Display Order</p>
                            <p className="text-sm">{project.display_order}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                            <p className="text-sm">{new Date(project.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Last Updated</p>
                            <p className="text-sm">{new Date(project.updated_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">Banner Image URL</p>
                            <p className="text-xs text-gray-600 break-all">{project.banner_image}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() => {
                              setViewingProject(null);
                              setEditingProject(project);
                              setProjectImageFile(null);
                              setProjectImagePreview('');
                              setPropertySearchQuery('');
                              setEditPropertyDropdownOpen(false);
                            }}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this project?')) {
                                deleteProject(project.id);
                                setViewingProject(null);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={project.banner_image}
                          alt={project.name}
                          className="w-full h-32 object-cover rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setViewingProject(project)}
                        />
                        <p className="text-sm font-medium mb-1">{project.name}</p>
                        <p className="text-xs text-gray-500 mb-2">
                          Property: {properties.find(p => p.id === project.property_id)?.name || 'Unknown'}
                        </p>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingProject(project)}
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingProject(project);
                              setProjectImageFile(null);
                              setProjectImagePreview('');
                              setPropertySearchQuery('');
                              setEditPropertyDropdownOpen(false);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this project?')) {
                                deleteProject(project.id);
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

              <div>
                <label className="block text-sm font-medium mb-2">Office Hours</label>
                <Textarea
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  rows={4}
                  placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed"
                />
                <p className="text-xs text-gray-500 mt-1">Use line breaks for each day/time period</p>
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
                        (supabase
                          .from('social_links') as any)
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
          {/* General Contact Information Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>General Contact Information</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Edit the contact information displayed on the contact page</p>
                </div>
                <Button
                  onClick={saveGeneralContactInfo}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Contact Info'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contact Email</label>
                <Input
                  type="email"
                  value={generalContactEmail}
                  onChange={(e) => setGeneralContactEmail(e.target.value)}
                  placeholder="paul@imagelocations.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Phone</label>
                <Input
                  type="tel"
                  value={generalContactPhone}
                  onChange={(e) => setGeneralContactPhone(e.target.value)}
                  placeholder="(310) 871-8004"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Address</label>
                <Textarea
                  value={generalContactAddress}
                  onChange={(e) => setGeneralContactAddress(e.target.value)}
                  placeholder="9663 Santa Monica Blvd. Suite 842,&#10;Beverly Hills, CA 90210"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Use line breaks to separate address lines</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Grid Management */}
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
                  {saving ? 'Saving...' : 'Save Grid'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            // Clear fields when changing type but keep position
                            name: null,
                            title: null,
                            email: null,
                            company_name: null,
                            external_url: null,
                            image_url: null
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

                    {/* Show content for non-empty slots */}
                    {entry.entry_type !== 'empty' && (
                      <>
                        {/* Image Section - FIXED FOR BOTH TYPES */}
                        <div className="mb-2">
                          <div className="w-full h-24 bg-gray-200 rounded mb-1 overflow-hidden">
                            {entry.image_url ? (
                              <img
                                src={entry.image_url}
                                alt={entry.entry_type === 'team' ? entry.name : entry.company_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs text-gray-500">No Image</div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                No Image
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById(`contact-img-${entry.position}`)?.click()}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            {entry.image_url ? 'Change Image' : 'Upload Image'}
                          </Button>
                          <input
                            id={`contact-img-${entry.position}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setUploadingLogo(true);
                                  const url = await uploadImageToS3(file);
                                  const newGrid = [...contactGrid];
                                  newGrid[index].image_url = url;
                                  setContactGrid(newGrid);
                                } catch (error) {
                                  console.error('Upload error:', error);
                                  alert('Error uploading image');
                                } finally {
                                  setUploadingLogo(false);
                                }
                              }
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
                          className="w-full mt-2 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Clear this slot?')) {
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
                            }
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

          {/* Contact Form Questions Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contact Form Questions</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage dynamic questions for contact and inquiry forms (Maximum 2 questions)
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Questions */}
              {contactFormQuestions.map((question, qIndex) => (
                <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={question.question_text}
                          onChange={(e) => {
                            const updated = [...contactFormQuestions];
                            updated[qIndex].question_text = e.target.value;
                            setContactFormQuestions(updated);
                          }}
                          onBlur={() => updateContactFormQuestion(question.id, { question_text: question.question_text })}
                          className="font-medium"
                          placeholder="Question text"
                        />
                        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={question.is_required}
                            onChange={(e) => {
                              updateContactFormQuestion(question.id, { is_required: e.target.checked });
                            }}
                            className="w-4 h-4"
                          />
                          Required
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">Field name: {question.field_name}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteContactFormQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Question Options */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options:</label>
                    {question.options && question.options.length > 0 ? (
                      question.options.map((option: any, optIndex: number) => (
                        <div key={option.id} className="flex gap-2 items-center">
                          <Input
                            value={option.option_label}
                            onChange={(e) => {
                              const updated = [...contactFormQuestions];
                              updated[qIndex].options[optIndex].option_label = e.target.value;
                              setContactFormQuestions(updated);
                            }}
                            onBlur={() => updateQuestionOption(option.id, option.option_label)}
                            placeholder="Option text (e.g., Motion Picture)"
                            className="flex-1"
                          />
                          <div className="text-xs text-gray-500 w-32 truncate" title={option.option_value}>
                            {option.option_value}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuestionOption(option.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No options yet</p>
                    )}

                    {/* Add New Option */}
                    <div className="flex gap-2 mt-2">
                      <Input
                        id={`new-option-label-${question.id}`}
                        placeholder="New option (e.g., Motion Picture)"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const labelInput = e.currentTarget;
                            if (labelInput.value.trim()) {
                              addQuestionOption(question.id, labelInput.value);
                              labelInput.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const labelInput = document.getElementById(`new-option-label-${question.id}`) as HTMLInputElement;
                          if (labelInput && labelInput.value.trim()) {
                            addQuestionOption(question.id, labelInput.value);
                            labelInput.value = '';
                          }
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Question */}
              {contactFormQuestions.length < 2 && (
                <div className="border-2 border-dashed rounded-lg p-4">
                  <h4 className="font-medium mb-3">Add New Question</h4>
                  <div className="space-y-3">
                    <Input
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Question text (e.g., Project Type)"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="new-question-required"
                        checked={newQuestionRequired}
                        onChange={(e) => setNewQuestionRequired(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="new-question-required" className="text-sm">
                        Required field
                      </label>
                    </div>
                    <Button
                      onClick={addContactFormQuestion}
                      disabled={saving || !newQuestionText.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </div>
              )}

              {contactFormQuestions.length >= 2 && (
                <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
                  Maximum number of questions reached (2). Delete a question to add a new one.
                </div>
              )}

              <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
                <strong>Note:</strong> These questions will appear on both the contact form and property inquiry forms.
                Changes are applied immediately.
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
                  <p className="text-sm text-gray-600 mt-1">Manage sections of the About page - Add, edit, or remove sections</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={addAboutSection}
                    variant="outline"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                  <Button
                    onClick={saveAllAboutContent}
                    disabled={saving}
                    size="lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save All Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
              {aboutSections.map((section, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-lg">
                      Section {index + 1}
                    </h4>
                    <Button
                      onClick={() => deleteAboutSection(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Section
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Media Type Selector */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Media Type</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={(!section.mediaType || section.mediaType === 'image') ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newSections = [...aboutSections];
                            if (!newSections[index]) newSections[index] = {};
                            newSections[index].mediaType = 'image';
                            // Clear video data when switching to image
                            delete newSections[index].videoUrl;
                            setAboutSections(newSections);
                          }}
                        >
                          <ImageIcon className="w-4 h-4 mr-1" />
                          Image
                        </Button>
                        <Button
                          type="button"
                          variant={section.mediaType === 'video' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newSections = [...aboutSections];
                            if (!newSections[index]) newSections[index] = {};
                            newSections[index].mediaType = 'video';
                            // Clear image data when switching to video
                            delete newSections[index].image;
                            setAboutSections(newSections);
                          }}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Video
                        </Button>
                        <Button
                          type="button"
                          variant={section.mediaType === 'none' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newSections = [...aboutSections];
                            if (!newSections[index]) newSections[index] = {};
                            newSections[index].mediaType = 'none';
                            // Clear media data
                            delete newSections[index].image;
                            delete newSections[index].videoUrl;
                            setAboutSections(newSections);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Text Only
                        </Button>
                      </div>
                    </div>

                    {/* Image upload for image type */}
                    {(!section.mediaType || section.mediaType === 'image') && (
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

                    {/* Video upload for video type */}
                    {section.mediaType === 'video' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Video</label>
                        {section?.videoUrl && (
                          <div className="w-full max-w-md mb-2">
                            <div className="relative" style={{ paddingBottom: '56.25%' }}>
                              <video
                                src={section.videoUrl}
                                className="absolute top-0 left-0 w-full h-full rounded"
                                controls
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                const newSections = [...aboutSections];
                                if (!newSections[index]) newSections[index] = {};
                                delete newSections[index].videoUrl;
                                setAboutSections(newSections);
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove Video
                            </Button>
                          </div>
                        )}
                        {!section?.videoUrl && (
                          <div>
                            <input
                              type="file"
                              accept="video/*"
                              id={`video-upload-${index}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleAboutVideoUpload(file, index);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById(`video-upload-${index}`)?.click()}
                              disabled={uploadingVideoForSection === index}
                            >
                              {uploadingVideoForSection === index ? (
                                <>
                                  <Video className="w-4 h-4 mr-2 animate-pulse" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Video
                                </>
                              )}
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">
                              Upload a video file (MP4, MOV, etc.). The video will be stored on S3.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Title field */}
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

                    {/* Subtitle field (optional) */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Subtitle (Optional)</label>
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

                    {/* Content field with proper line breaks support */}
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

                    {/* Link fields - always available */}
                    <div className="border-t pt-3">
                      <h5 className="text-sm font-medium mb-2">Link Settings (Optional)</h5>
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEARCH PAGE TAB */}
        {/* PROPERTY PAGE TAB */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Property Page Footer</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Manage the content displayed at the bottom of property detail pages</p>
                </div>
                <Button
                  onClick={savePropertyFooterContent}
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
                <label className="block text-sm font-medium mb-2">Contact Phone Number</label>
                <Input
                  value={propertyFooterPhone}
                  onChange={(e) => setPropertyFooterPhone(e.target.value)}
                  placeholder="(310) 871-8004"
                />
                <p className="text-xs text-gray-500 mt-1">Displayed with phone icon at the bottom of property pages</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Partner Text</label>
                <Input
                  value={propertyFooterPartnerText}
                  onChange={(e) => setPropertyFooterPartnerText(e.target.value)}
                  placeholder="American Express Preferred Partner"
                />
                <p className="text-xs text-gray-500 mt-1">Partnership or certification text</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">License Number</label>
                <Input
                  value={propertyFooterLicense}
                  onChange={(e) => setPropertyFooterLicense(e.target.value)}
                  placeholder="CalDRE #01234567"
                />
                <p className="text-xs text-gray-500 mt-1">Professional license or certification number</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <Input
                  value={propertyFooterCompanyName}
                  onChange={(e) => setPropertyFooterCompanyName(e.target.value)}
                  placeholder="Image Locations"
                />
                <p className="text-xs text-gray-500 mt-1">Used in copyright text: "© {new Date().getFullYear()} [Company Name]. All rights reserved."</p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Preview:</h4>
                <div className="space-y-2 text-center text-sm text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{propertyFooterPhone || '(310) 871-8004'}</span>
                  </div>
                  <div>{propertyFooterPartnerText || 'American Express Preferred Partner'}</div>
                  <div>{propertyFooterLicense || 'CalDRE #01234567'}</div>
                  <div className="text-xs text-gray-500">
                    © {new Date().getFullYear()} {propertyFooterCompanyName || 'Image Locations'}. All rights reserved.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIST YOUR PROPERTY TAB */}
        <TabsContent value="list-property" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>List Your Property - Form Questions</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Manage questions for the property listing form</p>
                </div>
                <Button
                  onClick={addNewQuestion}
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formQuestions.map((question, index) => (
                  <Card key={question.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Question {index + 1}</h4>
                            {question.is_required && <span className="text-red-600">*</span>}
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {question.question_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{question.question_text}</p>
                          {question.options.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-500 mb-1">Options:</p>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {question.options.map((opt, i) => (
                                  <li key={i}>{opt}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingQuestion(question)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => deleteFormQuestion(question.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Question Modal */}
          {editingQuestion && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {formQuestions.find(q => q.id === editingQuestion.id) ? 'Edit Question' : 'Add New Question'}
                    </CardTitle>
                    <Button
                      onClick={() => setEditingQuestion(null)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Question Text</Label>
                    <Textarea
                      value={editingQuestion.question_text}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question_text: e.target.value
                      })}
                      placeholder="Enter your question"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Question Type</Label>
                    <select
                      value={editingQuestion.question_type}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        question_type: e.target.value as 'radio' | 'checkbox' | 'text'
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="radio">Single Choice (Radio)</option>
                      <option value="checkbox">Multiple Choice (Checkbox)</option>
                      <option value="text">Text Input</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingQuestion.is_required}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        is_required: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <Label>Required Question</Label>
                  </div>

                  {(editingQuestion.question_type === 'radio' || editingQuestion.question_type === 'checkbox') && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Options</Label>
                        <Button
                          onClick={() => addOption(editingQuestion)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {editingQuestion.options.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(editingQuestion, index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                            />
                            <Button
                              onClick={() => removeOption(editingQuestion, index)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {editingQuestion.options.length === 0 && (
                          <p className="text-sm text-gray-500">No options added yet. Click "Add Option" to start.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      onClick={() => setEditingQuestion(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => saveFormQuestion(editingQuestion)}
                      disabled={!editingQuestion.question_text ||
                        ((editingQuestion.question_type === 'radio' || editingQuestion.question_type === 'checkbox') &&
                        editingQuestion.options.length === 0)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* OTHER PAGES TAB */}
        <TabsContent value="other" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>List Your Property - Terms & Conditions</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Edit the terms and conditions for property listings</p>
                </div>
                <Button
                  onClick={saveTermsAndConditions}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Terms'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Terms and Conditions Content</Label>
                  <p className="text-xs text-gray-500 mb-2">Use line breaks for paragraphs. Number items for lists.</p>
                  <Textarea
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Enter terms and conditions..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Photo Analysis Settings Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>AI Photo Analysis</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Control whether AI analyzes photos uploaded by admins</p>
                </div>
                <Button
                  onClick={saveAiPhotoAnalysisSetting}
                  disabled={saving}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Setting'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Enable AI Photo Analysis</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      When enabled, AI will automatically analyze and tag photos uploaded through the admin panel.
                      When disabled, photos will be uploaded without AI analysis.
                    </p>
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      Default: OFF (AI analysis disabled)
                    </p>
                  </div>
                  <button
                    onClick={() => setAiPhotoAnalysisEnabled(!aiPhotoAnalysisEnabled)}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ml-4 ${
                      aiPhotoAnalysisEnabled ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={aiPhotoAnalysisEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        aiPhotoAnalysisEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Current Status</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        AI Photo Analysis is currently <span className="font-bold">{aiPhotoAnalysisEnabled ? 'ENABLED' : 'DISABLED'}</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        {aiPhotoAnalysisEnabled
                          ? 'Photos uploaded through the admin panel will be analyzed by AI for automatic tagging and categorization.'
                          : 'Photos uploaded through the admin panel will NOT be analyzed by AI. Manual tagging will be required.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
