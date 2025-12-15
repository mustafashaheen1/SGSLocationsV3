import { NextRequest } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { sendPropertyTermsEmail } from '@/lib/sendgrid';
import { createClient, createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { propertyId, termsType, termsContent, termsPdfUrl } = await request.json();

    if (!propertyId || !termsType) {
      return jsonResponseNoCache(
        { error: 'Property ID and terms type are required' },
        { status: 400 }
      );
    }

    if (termsType !== 'text' && termsType !== 'pdf') {
      return jsonResponseNoCache(
        { error: 'Terms type must be either "text" or "pdf"' },
        { status: 400 }
      );
    }

    if (termsType === 'text' && !termsContent) {
      return jsonResponseNoCache(
        { error: 'Terms content is required for text type' },
        { status: 400 }
      );
    }

    if (termsType === 'pdf' && !termsPdfUrl) {
      return jsonResponseNoCache(
        { error: 'Terms PDF URL is required for PDF type' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS (this is an admin-only operation)
    const adminClient = createAdminClient();

    // Try to get current admin user ID for audit trail (optional)
    const regularClient = createClient();
    const { data: { session } } = await regularClient.auth.getSession();
    const adminUserId = session?.user?.id || null;

    // Get property details and owner information
    const { data: property, error: propertyError } = await (adminClient
      .from('properties') as any)
      .select('name, owner_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Property fetch error:', propertyError);
      return jsonResponseNoCache(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Get owner details
    const { data: owner, error: ownerError } = await (adminClient
      .from('users') as any)
      .select('email, full_name')
      .eq('id', property.owner_id)
      .single();

    if (ownerError || !owner) {
      console.error('Owner fetch error:', ownerError);
      return jsonResponseNoCache(
        { error: 'Property owner not found' },
        { status: 404 }
      );
    }

    // Update property with terms and conditions
    const { error: updateError } = await (adminClient
      .from('properties') as any)
      .update({
        terms_type: termsType,
        terms_content: termsType === 'text' ? termsContent : null,
        terms_pdf_url: termsType === 'pdf' ? termsPdfUrl : null,
        terms_sent_at: new Date().toISOString(),
        terms_sent_by: adminUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Error updating property with terms:', updateError);
      return jsonResponseNoCache(
        { error: 'Failed to save terms and conditions' },
        { status: 500 }
      );
    }

    // Send email
    console.log(`📧 Sending terms and conditions to ${owner.email}`);

    const success = await sendPropertyTermsEmail(
      owner.email,
      owner.full_name || 'Property Owner',
      property.name,
      termsType,
      termsContent,
      termsPdfUrl
    );

    if (success) {
      return jsonResponseNoCache({
        success: true,
        message: 'Terms and conditions sent successfully'
      });
    } else {
      return jsonResponseNoCache(
        { error: 'Failed to send terms and conditions email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending property terms email:', error);
    return jsonResponseNoCache(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
