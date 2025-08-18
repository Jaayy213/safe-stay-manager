import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import supabase from "../../supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Hotel, Users, Calendar, FileText, Shield, LogOut, UserCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { userProfile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [guests, setGuests] = useState<any[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Fetch users (guests) from Supabase
  useEffect(() => {
    const fetchGuests = async () => {
      setLoadingGuests(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "guest");

      if (error) {
        console.error("Error fetching guests:", error);
      } else {
        setGuests(data || []);
      }
      setLoadingGuests(false);
    };

    fetchGuests();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Hotel className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Hotel Manager</h1>
              <p className="text-sm text-muted-foreground">Guest Management System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <div className="text-right">
                <p className="text-sm font-medium">
                  {userProfile?.first_name} {userProfile?.last_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userProfile?.role}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Guests Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Guests</h2>
          {loadingGuests ? (
            <p>Loading guests...</p>
          ) : (
            <ul className="space-y-2">
              {guests.map((guest) => (
                <li key={guest.id} className="p-2 border rounded">
                  {guest.first_name} {guest.last_name} - {guest.email}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Cards Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Rooms Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/rooms")}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hotel className="h-5 w-5" />
                <span>Rooms</span>
              </CardTitle>
              <CardDescription>View and manage hotel rooms</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Browse available rooms, check status, and pricing</p>
            </CardContent>
          </Card>

          {/* Bookings Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/bookings")}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Bookings</span>
              </CardTitle>
              <CardDescription>
                {isAdmin ? "Manage all reservations" : "View your reservations"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isAdmin 
                  ? "View, create, and manage guest bookings" 
                  : "View your booking history and create new reservations"
                }
              </p>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/profile")}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCircle className="h-5 w-5" />
                <span>Profile</span>
              </CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update personal information and security settings
              </p>
            </CardContent>
          </Card>

          {/* Admin Only Cards */}
          {isAdmin && (
            <>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/users")}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Users</span>
                  </CardTitle>
                  <CardDescription>Manage user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage guest and admin accounts
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
