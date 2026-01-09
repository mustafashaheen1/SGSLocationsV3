'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PropertyCalendar from '@/components/PropertyCalendar';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PropertyCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkOwnershipAndFetchProperty();
  }, [propertyId]);

  async function checkOwnershipAndFetchProperty() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();

      if (!user || !session) {
        router.push('/dashboard');
        return;
      }

      // Check user type - only property owners can view calendars
      // Use directFetch with auth token to avoid cache issues
      const { directFetch } = await import('@/lib/supabase');
      const { data: userData, error: userError } = await directFetch('users', {
        select: 'user_type',
        eq: { id: user.id },
        single: true,
        authToken: session.access_token
      });

      if (userError || !userData || (userData as any)?.user_type !== 'property_owner') {
        console.error('User type check failed:', userError);
        alert('Only property owners can view property calendars');
        router.push('/dashboard');
        return;
      }

      // Fetch property and check ownership
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;

      // Check if user owns this property
      if ((propertyData as any).owner_id !== user.id) {
        alert('You do not have permission to view this calendar');
        router.push('/dashboard');
        return;
      }

      setProperty(propertyData);
      setIsOwner(true);
    } catch (error: any) {
      console.error('Error loading property:', error);
      alert('Failed to load property');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 md:pt-20 lg:pt-28">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!isOwner || !property) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 lg:pt-28">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'acumin-pro-wide' }}>
              Property Calendar
            </h1>
            <p className="text-gray-600 mt-1">
              {property.name || property.address}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <PropertyCalendar propertyId={propertyId} />
        </div>
      </div>
    </div>
  );
}
