import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Calendar, Plus, Users, DollarSign, Clock, FileText } from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { generateCSRFToken } from "@/lib/security";

interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  status: string;
  special_requests?: string;
  created_at: string;
  rooms?: {
    room_number: string;
    room_type: string;
    price_per_night: number;
  };
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  status: string;
}

const Bookings = () => {
  const { user, userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const preselectedRoomId = searchParams.get("room");
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [formData, setFormData] = useState({
    room_id: preselectedRoomId || "",
    check_in_date: "",
    check_out_date: "",
    guest_count: "1",
    special_requests: "",
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("bookings")
        .select(`
          *,
          rooms (room_number, room_type, price_per_night),
          users (first_name, last_name, email)
        `);

      if (!isAdmin) {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch bookings",
          variant: "destructive",
        });
        return;
      }

      setBookings(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("status", "available")
        .order("room_number");

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [isAdmin, user?.id]);

  // Auto-open dialog when accessing /bookings/create
  useEffect(() => {
    if (location.pathname === '/bookings/create') {
      setDialogOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Generate CSRF token when dialog opens
    if (dialogOpen) {
      setCsrfToken(generateCSRFToken());
    }
  }, [dialogOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // XSS protection
    const sanitizedValue = value.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const calculateTotalAmount = () => {
    if (!formData.room_id || !formData.check_in_date || !formData.check_out_date) return 0;
    
    const room = rooms.find(r => r.id === formData.room_id);
    if (!room) return 0;

    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return nights > 0 ? nights * room.price_per_night : 0;
  };

  const validateDates = () => {
    if (!formData.check_in_date || !formData.check_out_date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    
    return checkIn >= today && checkOut > checkIn;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a booking",
        variant: "destructive",
      });
      return;
    }

    // Check if user profile exists
    if (!userProfile) {
      toast({
        title: "Profile Error",
        description: "User profile not found. Please try signing out and back in.",
        variant: "destructive",
      });
      return;
    }
    
    // Input validation
    if (!formData.room_id || !formData.check_in_date || !formData.check_out_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!validateDates()) {
      toast({
        title: "Invalid Dates",
        description: "Check-in must be today or later, and check-out must be after check-in",
        variant: "destructive",
      });
      return;
    }

    const guestCount = parseInt(formData.guest_count);
    const selectedRoom = rooms.find(r => r.id === formData.room_id);
    
    if (!selectedRoom) {
      toast({
        title: "Error",
        description: "Selected room not found",
        variant: "destructive",
      });
      return;
    }

    if (guestCount > selectedRoom.capacity) {
      toast({
        title: "Validation Error",
        description: `Guest count cannot exceed room capacity of ${selectedRoom.capacity}`,
        variant: "destructive",
      });
      return;
    }

    const totalAmount = calculateTotalAmount();
    if (totalAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Invalid booking duration",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      user_id: user?.id,
      room_id: formData.room_id,
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      guest_count: guestCount,
      total_amount: totalAmount,
      special_requests: formData.special_requests || null,
      csrf_token: csrfToken, // CSRF protection
      status: "pending",
    };

    try {
      console.log("Attempting to create booking with data:", bookingData);
      console.log("Current user:", user);
      console.log("User profile:", userProfile);
      
      const { error } = await supabase
        .from("bookings")
        .insert(bookingData);

      if (error) {
        console.error("Supabase booking error:", error);
        
        // Check if it's a foreign key constraint error for user_id
        if (error.message.includes("violates foreign key constraint") && 
            error.message.includes("user_id")) {
          
          console.log("Foreign key constraint error - attempting to create user record");
          
          // Try to create the missing user record
          try {
            const { error: userError } = await supabase
              .from("users")
              .insert({
                id: user?.id,
                email: user?.email || "",
                first_name: user?.user_metadata?.first_name || "",
                last_name: user?.user_metadata?.last_name || "",
                phone: user?.user_metadata?.phone || "",
                role: "guest",
                password_hash: "managed_by_supabase_auth",
              });

            if (userError) {
              console.error("Failed to create user record:", userError);
              throw new Error("User profile creation failed. Please contact support.");
            }

            // Retry the booking creation
            const { error: retryError } = await supabase
              .from("bookings")
              .insert(bookingData);

            if (retryError) {
              throw retryError;
            }

            toast({
              title: "Success",
              description: "Booking created successfully",
            });

            await fetchBookings();
            setDialogOpen(false);
            resetForm();
            return;

          } catch (userCreationError) {
            console.error("User creation error:", userCreationError);
            throw new Error("Failed to create user profile. Please try signing out and back in.");
          }
        }
        
        throw error;
      }

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      await fetchBookings();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Booking creation failed:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      room_id: "",
      check_in_date: "",
      check_out_date: "",
      guest_count: "1",
      special_requests: "",
    });
    setCsrfToken("");
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can update booking status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking status updated",
      });

      await fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  const openDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              ←
            </Button>
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Manage all reservations" : "Your reservations"}
              </p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>
                  Make a new reservation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="csrf_token" value={csrfToken} />
                
                <div className="space-y-2">
                  <Label htmlFor="room_id">Room *</Label>
                  <Select value={formData.room_id} onValueChange={(value) => setFormData(prev => ({ ...prev, room_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.room_number} - {room.room_type} (${room.price_per_night}/night)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="check_in_date">Check-in *</Label>
                    <Input
                      id="check_in_date"
                      name="check_in_date"
                      type="date"
                      value={formData.check_in_date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_out_date">Check-out *</Label>
                    <Input
                      id="check_out_date"
                      name="check_out_date"
                      type="date"
                      value={formData.check_out_date}
                      onChange={handleInputChange}
                      min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_count">Guests *</Label>
                  <Select value={formData.guest_count} onValueChange={(value) => setFormData(prev => ({ ...prev, guest_count: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} guest{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <Textarea
                    id="special_requests"
                    name="special_requests"
                    value={formData.special_requests}
                    onChange={handleInputChange}
                    maxLength={500}
                    placeholder="Any special requests or notes..."
                    rows={3}
                  />
                </div>

                {formData.room_id && formData.check_in_date && formData.check_out_date && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-lg font-bold">${calculateTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Booking
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>
                      {booking.rooms?.room_number ? `Room ${booking.rooms.room_number}` : "Room Details"}
                    </span>
                  </CardTitle>
                  <Badge variant={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
                <CardDescription>
                  {booking.rooms?.room_type} • {isAdmin && booking.users && (
                    `${booking.users.first_name} ${booking.users.last_name}`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Check-in</p>
                      <p className="text-muted-foreground">{new Date(booking.check_in_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Check-out</p>
                      <p className="text-muted-foreground">{new Date(booking.check_out_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Guests</p>
                      <p className="text-muted-foreground">{booking.guest_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-muted-foreground">${booking.total_amount}</p>
                    </div>
                  </div>
                </div>

                {booking.special_requests && (
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium text-sm">Special Requests</p>
                      <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
                    </div>
                  </div>
                )}

                {isAdmin && booking.status === "pending" && (
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateBookingStatus(booking.id, "confirmed")}
                    >
                      Confirm
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateBookingStatus(booking.id, "cancelled")}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin ? "No bookings have been made yet" : "You haven't made any bookings yet"}
            </p>
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Booking
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Bookings;