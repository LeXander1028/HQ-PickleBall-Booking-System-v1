import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProfile(data[0]);
        return data[0];
      } else {
        // If profile row doesn't exist, create one
        const newProfile = {
          id: userId,
          name: user?.email ? user.email.split('@')[0] : 'New Player',
          phone: '',
          address: '',
          onboarding_completed: false,
          role: 'user'
        };
        const { data: insData } = await supabase.from('profiles').insert(newProfile);
        if (insData) {
          const created = Array.isArray(insData) ? insData[0] : insData;
          setProfile(created);
          return created;
        }
      }
    } catch (err) {
      console.error("Error fetching player profile:", err);
    }
    return null;
  }

  async function refreshProfile() {
    if (user) {
      return await fetchProfile(user.id);
    }
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    return data;
  };

  const signup = async (email, password, name, phone, address) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, address }
      }
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    // In a live Supabase project, profiles row is synced via triggers,
    // but in case of delay or Simulation Mode, we insert the row manually.
    if (data?.user) {
      const newProfile = {
        id: data.user.id,
        name: name,
        phone: phone,
        address: address,
        onboarding_completed: true,
        role: 'user'
      };
      await supabase.from('profiles').insert(newProfile);
    }
    return data;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
