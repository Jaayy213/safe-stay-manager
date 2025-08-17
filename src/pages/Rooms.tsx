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
import { Loader2, Hotel, Plus, Edit, Trash2, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  price_per_night: number;
  description?: string;
  amenities?: string[];
  status: string;
  created_at: string;
}

const Rooms = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "",
    capacity: "",
    price_per_night: "",
    description: "",
    amenities: "",
    status: "available",
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number");

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch rooms",
          variant: "destructive",
        });
        return;
      }

      setRooms(data || []);
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

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const resetForm = () => {
    setFormData({
      room_number: "",
      room_type: "",
      capacity: "",
      price_per_night: "",
      description: "",
      amenities: "",
      status: "available",
    });
    setEditingRoom(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage rooms",
        variant: "destructive",
      });
      return;
    }

    // Input validation
    if (!formData.room_number || !formData.room_type || !formData.capacity || !formData.price_per_night) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const capacity = parseInt(formData.capacity);
    const price = parseFloat(formData.price_per_night);

    if (isNaN(capacity) || capacity < 1 || capacity > 10) {
      toast({
        title: "Validation Error",
        description: "Capacity must be between 1 and 10",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(price) || price < 0 || price > 10000) {
      toast({
        title: "Validation Error",
        description: "Price must be between $0 and $10,000",
        variant: "destructive",
      });
      return;
    }

    const amenitiesArray = formData.amenities
      .split(",")
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const roomData = {
      room_number: formData.room_number,
      room_type: formData.room_type,
      capacity,
      price_per_night: price,
      description: formData.description || null,
      amenities: amenitiesArray.length > 0 ? amenitiesArray : null,
      status: formData.status,
    };

    try {
      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", editingRoom.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Room updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert(roomData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Room created successfully",
        });
      }

      await fetchRooms();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save room",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      capacity: room.capacity.toString(),
      price_per_night: room.price_per_night.toString(),
      description: room.description || "",
      amenities: room.amenities?.join(", ") || "",
      status: room.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete rooms",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });

      await fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
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
            <Hotel className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rooms</h1>
              <p className="text-sm text-muted-foreground">Manage hotel rooms</p>
            </div>
          </div>
          
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
                  <DialogDescription>
                    {editingRoom ? "Update room information" : "Create a new room"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room_number">Room Number *</Label>
                      <Input
                        id="room_number"
                        name="room_number"
                        value={formData.room_number}
                        onChange={handleInputChange}
                        required
                        maxLength={10}
                        placeholder="101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room_type">Type *</Label>
                      <Input
                        id="room_type"
                        name="room_type"
                        value={formData.room_type}
                        onChange={handleInputChange}
                        required
                        maxLength={50}
                        placeholder="Standard"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        required
                        placeholder="2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price_per_night">Price/Night *</Label>
                      <Input
                        id="price_per_night"
                        name="price_per_night"
                        type="number"
                        min="0"
                        max="10000"
                        step="0.01"
                        value={formData.price_per_night}
                        onChange={handleInputChange}
                        required
                        placeholder="99.99"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={handleSelectChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                    <Input
                      id="amenities"
                      name="amenities"
                      value={formData.amenities}
                      onChange={handleInputChange}
                      maxLength={200}
                      placeholder="WiFi, TV, AC, Mini-bar"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      maxLength={500}
                      placeholder="Room description..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRoom ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Hotel className="h-5 w-5" />
                    <span>Room {room.room_number}</span>
                  </CardTitle>
                  <Badge variant={room.status === "available" ? "default" : "secondary"}>
                    {room.status}
                  </Badge>
                </div>
                <CardDescription className="capitalize">
                  {room.room_type}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{room.capacity} guests</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${room.price_per_night}/night</span>
                  </div>
                </div>

                {room.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {room.description}
                  </p>
                )}

                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {room.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{room.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(room.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {!isAdmin && room.status === "available" && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/bookings/create?room=${room.id}`)}
                  >
                    Book Now
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No rooms found</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin ? "Start by adding your first room" : "No rooms are available at the moment"}
            </p>
            {isAdmin && (
              <Button onClick={openDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Rooms;