'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Camera, Home, Search, Heart, MessageSquare, Calendar, Settings,
  LogOut, Bell, TrendingUp, Eye, MapPin, Clock, DollarSign,
  CheckCircle, XCircle, Archive, Plus, Download, Share2, FolderOpen,
  Tag, AlertCircle, BarChart3, Users, FileText, Star, Filter,
  ChevronRight, Grid, List, Map as MapIcon, Edit, Trash2, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

const dummyProductionData = {
  user: {
    name: 'John Smith',
    email: 'john.smith@productionco.com',
    company: 'DFW Productions LLC',
    type: 'production',
    memberSince: '2023',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
  },
  stats: {
    savedLocations: 24,
    activeSearches: 5,
    sentInquiries: 12,
    responseRate: '85%'
  },
  savedLocations: [
    { id: 1, name: 'Modern Downtown Loft', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', city: 'Dallas', price: '$2,500/day', collection: 'Urban Scenes', tags: ['Modern', 'Loft'], notes: 'Perfect for tech company scene' },
    { id: 2, name: 'Historic Mansion', image: 'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=400', city: 'Fort Worth', price: '$3,500/day', collection: 'Period Pieces', tags: ['Historic', 'Mansion'], notes: 'Great for period drama' },
    { id: 3, name: 'Rustic Ranch', image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400', city: 'Denton', price: '$1,800/day', collection: 'Western', tags: ['Ranch', 'Rural'], notes: 'Horse stables available' },
    { id: 4, name: 'Waterfront Property', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', city: 'Arlington', price: '$2,800/day', collection: 'Lakefront', tags: ['Water', 'Modern'], notes: 'Sunset shots ideal' },
  ],
  savedSearches: [
    { id: 1, name: 'Modern Office Spaces', filters: 'Type: Commercial, Style: Modern', newMatches: 3, alerts: true, frequency: 'Daily' },
    { id: 2, name: 'Period Homes 1920s', filters: 'Type: Residential, Year: 1920-1930', newMatches: 0, alerts: true, frequency: 'Weekly' },
    { id: 3, name: 'Ranch Properties', filters: 'Type: Ranch, Area: 5+ acres', newMatches: 2, alerts: false, frequency: 'Never' },
    { id: 4, name: 'Downtown Lofts', filters: 'Type: Loft, Location: Downtown', newMatches: 1, alerts: true, frequency: 'Immediate' },
    { id: 5, name: 'Waterfront Locations', filters: 'Feature: Lake/Pool', newMatches: 4, alerts: true, frequency: 'Daily' },
  ],
  inquiries: [
    { id: 1, property: 'Modern Downtown Loft', date: '2024-10-28', status: 'pending', lastMessage: 'Is the location available for 3 days starting Nov 15?' },
    { id: 2, property: 'Historic Mansion', date: '2024-10-25', status: 'responded', lastMessage: 'Thank you for confirming availability.' },
    { id: 3, property: 'Rustic Ranch', date: '2024-10-20', status: 'responded', lastMessage: 'We would like to schedule a scout visit.' },
    { id: 4, property: 'Beach House', date: '2024-10-15', status: 'archived', lastMessage: 'Project was cancelled.' },
  ],
  collections: [
    { name: 'Urban Scenes', count: 8 },
    { name: 'Period Pieces', count: 5 },
    { name: 'Western', count: 3 },
    { name: 'Lakefront', count: 6 },
    { name: 'Commercial', count: 4 }
  ]
};

const dummyOwnerData = {
  user: {
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    type: 'property_owner',
    memberSince: '2022',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
  },
  stats: {
    totalProperties: 3,
    activeBookings: 2,
    monthlyViews: 458,
    totalEarnings: '$12,450',
    avgResponseTime: '2.5 hours',
    occupancyRate: '68%'
  },
  properties: [
    {
      id: 1,
      name: 'Luxury Modern Estate',
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400',
      status: 'active',
      views: 234,
      inquiries: 8,
      bookings: 3,
      earnings: '$8,500',
      nextBooking: 'Nov 15-18',
      rating: 4.8
    },
    {
      id: 2,
      name: 'Downtown Studio Loft',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      status: 'active',
      views: 156,
      inquiries: 5,
      bookings: 2,
      earnings: '$3,200',
      nextBooking: 'Nov 22-23',
      rating: 4.6
    },
    {
      id: 3,
      name: 'Suburban Family Home',
      image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400',
      status: 'pending',
      views: 68,
      inquiries: 2,
      bookings: 0,
      earnings: '$750',
      nextBooking: 'None',
      rating: 0
    }
  ],
  bookingRequests: [
    { id: 1, property: 'Luxury Modern Estate', production: 'Netflix Series', dates: 'Nov 15-18', status: 'confirmed', value: '$3,500' },
    { id: 2, property: 'Downtown Studio Loft', production: 'Car Commercial', dates: 'Nov 22-23', status: 'confirmed', value: '$1,600' },
    { id: 3, property: 'Luxury Modern Estate', production: 'Music Video', dates: 'Dec 5-6', status: 'pending', value: '$2,000' },
    { id: 4, property: 'Suburban Family Home', production: 'Student Film', dates: 'Dec 10', status: 'pending', value: '$500' },
  ],
  messages: [
    { id: 1, from: 'DFW Productions', subject: 'Location Scout Request', date: '2 hours ago', unread: true },
    { id: 2, from: 'Paramount Pictures', subject: 'Booking Confirmation', date: '1 day ago', unread: false },
    { id: 3, from: 'Local Commercial Co', subject: 'Question about parking', date: '2 days ago', unread: false },
  ],
  analytics: {
    viewsTrend: [
      { month: 'Aug', views: 320 },
      { month: 'Sep', views: 385 },
      { month: 'Oct', views: 458 },
    ],
    topSources: [
      { source: 'Direct Search', percentage: 45 },
      { source: 'Featured Listings', percentage: 30 },
      { source: 'Category Browse', percentage: 25 },
    ]
  }
};

export default function DashboardPage() {
  const [userType, setUserType] = useState<'production' | 'property_owner'>('production');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen bg-gray-50" style={{ paddingTop: '60px' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userType === 'production' ? 'Production Dashboard' : 'Property Owner Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {userType === 'production' ? dummyProductionData.user.name : dummyOwnerData.user.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {userType === 'production' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Saved Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyProductionData.stats.savedLocations}</div>
                  <p className="text-xs text-gray-500 mt-1">Across 5 collections</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Searches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyProductionData.stats.activeSearches}</div>
                  <p className="text-xs text-gray-500 mt-1">10 new matches</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Sent Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyProductionData.stats.sentInquiries}</div>
                  <p className="text-xs text-gray-500 mt-1">3 pending responses</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyProductionData.stats.responseRate}</div>
                  <p className="text-xs text-green-600 mt-1">↑ 5% this month</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="saved" className="space-y-6">
              <TabsList>
                <TabsTrigger value="saved">Saved Locations</TabsTrigger>
                <TabsTrigger value="searches">My Searches</TabsTrigger>
                <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
                <TabsTrigger value="settings">Account Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="saved" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Saved Locations</CardTitle>
                      <div className="flex items-center gap-2">
                        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Collections</SelectItem>
                            {dummyProductionData.collections.map(col => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name} ({col.count})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <FolderOpen className="w-4 h-4 mr-2" />
                          New Collection
                        </Button>
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                          >
                            <Grid className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Collection
                      </Button>
                      <Button variant="outline" size="sm">
                        <Tag className="w-4 h-4 mr-2" />
                        Bulk Tag
                      </Button>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dummyProductionData.savedLocations.map(location => (
                          <Card key={location.id} className="overflow-hidden">
                            <div className="aspect-video relative">
                              <Image
                                src={location.image}
                                alt={location.name}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                                  <Heart className="w-4 h-4 fill-current" />
                                </Button>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold">{location.name}</h3>
                              <p className="text-sm text-gray-600">{location.city} • {location.price}</p>
                              <div className="flex gap-1 mt-2">
                                {location.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              {location.notes && (
                                <p className="text-xs text-gray-500 mt-2 italic">&quot;{location.notes}&quot;</p>
                              )}
                              <div className="flex justify-between items-center mt-3">
                                <Badge variant="outline">{location.collection}</Badge>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dummyProductionData.savedLocations.map(location => (
                          <Card key={location.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="w-24 h-16 relative flex-shrink-0">
                                <Image
                                  src={location.image}
                                  alt={location.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{location.name}</h3>
                                <p className="text-sm text-gray-600">{location.city} • {location.price}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{location.collection}</Badge>
                                  {location.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline">View</Button>
                                <Button size="sm" variant="ghost">
                                  <Heart className="w-4 h-4 fill-current" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="searches" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Saved Searches</CardTitle>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Search
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dummyProductionData.savedSearches.map(search => (
                        <Card key={search.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{search.name}</h3>
                                  {search.newMatches > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {search.newMatches} new
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{search.filters}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={search.alerts}
                                      className="h-4 w-8"
                                    />
                                    <span className="text-sm text-gray-600">Email Alerts</span>
                                  </div>
                                  <Select value={search.frequency}>
                                    <SelectTrigger className="w-[120px] h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Immediate">Immediate</SelectItem>
                                      <SelectItem value="Daily">Daily</SelectItem>
                                      <SelectItem value="Weekly">Weekly</SelectItem>
                                      <SelectItem value="Never">Never</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  View Results
                                </Button>
                                <Button size="sm" variant="ghost">
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
              </TabsContent>

              <TabsContent value="inquiries" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Inquiry Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">
                          Pending
                          <Badge variant="secondary" className="ml-2 text-xs">1</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="responded">Responded</TabsTrigger>
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                      </TabsList>

                      <div className="space-y-3">
                        {dummyProductionData.inquiries.map(inquiry => (
                          <Card key={inquiry.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{inquiry.property}</h3>
                                    <Badge
                                      variant={
                                        inquiry.status === 'pending' ? 'default' :
                                        inquiry.status === 'responded' ? 'secondary' :
                                        'outline'
                                      }
                                    >
                                      {inquiry.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{inquiry.lastMessage}</p>
                                  <p className="text-xs text-gray-500 mt-2">Sent {inquiry.date}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    View Thread
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Archive className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 relative rounded-full overflow-hidden">
                          <Image
                            src={dummyProductionData.user.profileImage}
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button variant="outline">Change Photo</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input defaultValue={dummyProductionData.user.name} />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input defaultValue={dummyProductionData.user.email} type="email" />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input defaultValue={dummyProductionData.user.company} />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input defaultValue="+1 (555) 123-4567" type="tel" />
                        </div>
                      </div>
                      <Button>Save Changes</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Password & Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <Button variant="outline">
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive updates via email</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New Match Alerts</p>
                            <p className="text-sm text-gray-600">Get notified about new properties</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Inquiry Responses</p>
                            <p className="text-sm text-gray-600">Notifications when owners respond</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Newsletter</p>
                            <p className="text-sm text-gray-600">Tips and featured locations</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Profile Visibility</p>
                            <p className="text-sm text-gray-600">Make your profile visible to property owners</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Share Activity</p>
                            <p className="text-sm text-gray-600">Allow owners to see your viewing history</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyOwnerData.stats.totalProperties}</div>
                  <p className="text-xs text-gray-500">2 active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyOwnerData.stats.activeBookings}</div>
                  <p className="text-xs text-gray-500">2 pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Monthly Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyOwnerData.stats.monthlyViews}</div>
                  <p className="text-xs text-green-600">↑ 19%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyOwnerData.stats.totalEarnings}</div>
                  <p className="text-xs text-gray-500">This year</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyOwnerData.stats.avgResponseTime}</div>
                  <p className="text-xs text-green-600">Excellent</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dummyOwnerData.stats.occupancyRate}</div>
                  <p className="text-xs text-gray-500">↑ 8%</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="properties" className="space-y-6">
              <TabsList>
                <TabsTrigger value="properties">My Properties</TabsTrigger>
                <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Property Management</CardTitle>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Property
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {dummyOwnerData.properties.map(property => (
                        <Card key={property.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-32 h-24 relative flex-shrink-0">
                                <Image
                                  src={property.image}
                                  alt={property.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-lg">{property.name}</h3>
                                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                                        {property.status}
                                      </Badge>
                                      {property.rating > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                          <span className="text-sm">{property.rating}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mt-3">
                                      <div>
                                        <p className="text-xs text-gray-500">Views</p>
                                        <p className="font-semibold">{property.views}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Inquiries</p>
                                        <p className="font-semibold">{property.inquiries}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Bookings</p>
                                        <p className="font-semibold">{property.bookings}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Earnings</p>
                                        <p className="font-semibold">{property.earnings}</p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                      Next booking: {property.nextBooking}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dummyOwnerData.bookingRequests.map(booking => (
                        <Card key={booking.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{booking.property}</h3>
                                  <Badge
                                    variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                                  >
                                    {booking.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Production: {booking.production}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Dates: {booking.dates} • Value: {booking.value}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {booking.status === 'pending' && (
                                  <>
                                    <Button size="sm" variant="default">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Accept
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Decline
                                    </Button>
                                  </>
                                )}
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Availability Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Interactive calendar will show here</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Manage availability, view bookings, and set blackout dates
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Message Center</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dummyOwnerData.messages.map(message => (
                        <Card key={message.id} className={message.unread ? 'border-blue-500' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{message.from}</h3>
                                  {message.unread && (
                                    <Badge variant="default" className="text-xs">New</Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mt-1">{message.subject}</p>
                                <p className="text-xs text-gray-500 mt-2">{message.date}</p>
                              </div>
                              <Button size="sm" variant="outline">
                                Read Message
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-3">Monthly Views</h3>
                          <div className="space-y-2">
                            {dummyOwnerData.analytics.viewsTrend.map((item, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <span className="text-sm w-12">{item.month}</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                  <div
                                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${(item.views / 500) * 100}%` }}
                                  >
                                    <span className="text-xs text-white font-medium">{item.views}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-3">Top Traffic Sources</h3>
                          <div className="space-y-2">
                            {dummyOwnerData.analytics.topSources.map((source, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm">{source.source}</span>
                                <span className="font-semibold">{source.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-500">4.7</div>
                          <p className="text-sm text-gray-600 mt-1">Avg Rating</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-500">92%</div>
                          <p className="text-sm text-gray-600 mt-1">Response Rate</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-500">2.5h</div>
                          <p className="text-sm text-gray-600 mt-1">Avg Response</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-500">68%</div>
                          <p className="text-sm text-gray-600 mt-1">Booking Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 relative rounded-full overflow-hidden">
                          <Image
                            src={dummyOwnerData.user.profileImage}
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button variant="outline">Change Photo</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input defaultValue={dummyOwnerData.user.name} />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input defaultValue={dummyOwnerData.user.email} type="email" />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input defaultValue="+1 (555) 987-6543" type="tel" />
                        </div>
                        <div>
                          <Label>Member Since</Label>
                          <Input defaultValue={dummyOwnerData.user.memberSince} disabled />
                        </div>
                      </div>
                      <Button>Save Changes</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Bank Account</Label>
                          <Input defaultValue="****1234" />
                        </div>
                        <div>
                          <Label>Tax ID</Label>
                          <Input defaultValue="**-***1234" />
                        </div>
                        <Button variant="outline">Update Payment Info</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Booking Requests</p>
                            <p className="text-sm text-gray-600">Get notified about new bookings</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Messages</p>
                            <p className="text-sm text-gray-600">Production company inquiries</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Property Views</p>
                            <p className="text-sm text-gray-600">Weekly view reports</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}
