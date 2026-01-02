import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function useSchoolProfile(userId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from('school_profile')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      });
  }, [userId]);

  return { data, loading };
}
