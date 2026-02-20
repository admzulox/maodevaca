import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const getCurrentProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data as UserProfile;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
