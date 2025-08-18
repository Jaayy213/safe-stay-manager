import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If user doesn't exist in custom users table, create it
        if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
          console.log("User not found in custom users table, creating record...");
          await createUserRecord(userId);
          return;
        }
        console.error("Error fetching user profile:", error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const createUserRecord = async (userId: string) => {
    try {
      // Get the current auth user data
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      const { error } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: authUser.email || "",
          first_name: authUser.user_metadata?.first_name || "",
          last_name: authUser.user_metadata?.last_name || "",
          phone: authUser.user_metadata?.phone || "",
          role: "guest",
          password_hash: "managed_by_supabase_auth",
        });

      if (error) {
        console.error("Failed to create user record:", error);
        return;
      }

      // Fetch the newly created profile
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error creating user record:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  const isAdmin = userProfile?.role === "admin";
  const isGuest = userProfile?.role === "guest";

  return {
    user,
    session,
    userProfile,
    loading,
    signOut,
    isAdmin,
    isGuest,
  };
};