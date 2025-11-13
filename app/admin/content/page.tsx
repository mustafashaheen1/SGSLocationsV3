'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, Globe, Home, Search, FileText, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImageToS3 } from '@/lib/s3-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [saving, setSaving] = useState(false);

  // About Page Content
  const [aboutSections, setAboutSections] = useState<any[]>(Array(11).fill({}));

  useEffect(() => {
    if (activeTab === 'about') {
      fetchAboutContent();
    }
  }, [activeTab]);

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
        <TabsContent value="home">
          <Card>
            <CardContent className="py-8 text-center">
              <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Home page content management coming soon...</p>
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

        {/* FOOTER TAB */}
        <TabsContent value="footer">
          <Card>
            <CardContent className="py-8 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Footer content management coming soon...</p>
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
