
import { supabase } from './supabase';
import { Profile } from '../types';

export const signIn = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// --- Profile Management ---

export const getProfile = async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
    console.error("Error fetching profile:", error);
  }

  // Fallback if profile doesn't exist yet (before trigger run or sync)
  if (!data) {
    return {
      id: user.id,
      email: user.email || '',
      role: user.email === 'airtonmaiamt@gmail.com' ? 'admin' : 'user'
    };
  }

  return data as Profile;
};

export const updateProfile = async (updates: Partial<Profile>) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      updated_at: new Date().toISOString(),
      ...updates,
    });

  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
};
