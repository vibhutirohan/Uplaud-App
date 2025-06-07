
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  created_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setProfile(data);
        }
      } catch (err) {
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
};
