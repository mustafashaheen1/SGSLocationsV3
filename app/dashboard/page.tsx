'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Calendar, Eye, Plus } from 'lucide-react';
import { supabase, Property, Booking } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setUserProfile(profile);

      if (profile?.user_type === 'property_owner') {
        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id);
        setProperties(props || []);
      }

      const { data: userBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);
      setBookings(userBookings || []);

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 pt-[110px] flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-[110px]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {userProfile?.full_name || user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile?.user_type === 'property_owner' ? 'My Properties' : 'Saved Locations'}
              </CardTitle>
              <Home className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile?.user_type === 'property_owner' ? 'Booking Requests' : 'My Bookings'}
              </CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {userProfile?.user_type === 'property_owner' && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Properties</CardTitle>
                  <CardDescription>Manage your listed properties</CardDescription>
                </div>
                <Button
                  onClick={() => router.push('/list-property')}
                  className="bg-[#dc2626] hover:bg-[#b91c1c]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">You haven't listed any properties yet</p>
                  <Button
                    onClick={() => router.push('/list-property')}
                    className="bg-[#dc2626] hover:bg-[#b91c1c]"
                  >
                    List Your First Property
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{property.name}</h3>
                        <p className="text-sm text-gray-600">{property.city}, Texas</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                          property.status === 'active' ? 'bg-green-100 text-green-800' :
                          property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#dc2626]">${property.daily_rate}/day</div>
                        <Link href={`/property/${property.id}`} className="text-sm text-blue-600 hover:underline">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {userProfile?.user_type === 'production' && (
          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>View your booking history</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No bookings yet</p>
                  <Button
                    onClick={() => router.push('/search')}
                    className="bg-[#dc2626] hover:bg-[#b91c1c]"
                  >
                    Search Locations
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">Booking #{booking.id.slice(0, 8)}</h3>
                          <p className="text-sm text-gray-600">
                            {booking.start_date} - {booking.end_date}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
