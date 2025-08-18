// src/pages/Profile.tsx
import { useEffect, useState } from "react";
// import { supabase } from "../supabase/client"; // adjust path if needed
import { supabase } from '../../supabase/client';



export default function Profile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error.message);
      } else {
        setUser(user);
      }
    };

    getUser();
  }, []);

  if (!user) {
    return <p className="p-6">Loading profile...</p>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <div className="space-y-3">
        <p>
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        <p>
          <span className="font-semibold">User ID:</span> {user.id}
        </p>

        {/* Metadata (if you store extra profile fields) */}
        {user.user_metadata && (
          <div>
            <span className="font-semibold">Full Name:</span>{" "}
            {user.user_metadata.full_name || "Not set"}
          </div>
        )}

        <div className="mt-6">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
