import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('smugmug_tokens')
      .select('access_token, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ authorized: false });
    }

    return NextResponse.json({
      authorized: true,
      authorizedAt: data.created_at
    });
  } catch (error) {
    return NextResponse.json({ authorized: false });
  }
}
