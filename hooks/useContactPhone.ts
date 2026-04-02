'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

let cachedPhone: string | null = null;

export function useContactPhone() {
  const [contactPhone, setContactPhone] = useState<string>(cachedPhone ?? '');

  useEffect(() => {
    if (cachedPhone) {
      setContactPhone(cachedPhone);
      return;
    }
    (supabase
      .from('site_settings') as any)
      .select('value')
      .eq('key', 'contact_phone')
      .single()
      .then(({ data }: { data: any }) => {
        if (data?.value) {
          let v = data.value;
          try {
            while (typeof v === 'string' && v.startsWith('"')) v = JSON.parse(v);
          } catch {}
          cachedPhone = v;
          setContactPhone(v);
        }
      });
  }, []);

  function friendlyError() {
    return `Looks like you ran into an issue. Please try again. If the situation persists please feel free to contact us at ${contactPhone || 'our office'}.`;
  }

  return { contactPhone, friendlyError };
}
