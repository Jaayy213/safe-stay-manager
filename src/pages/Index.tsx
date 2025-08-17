import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Shield, Users, Calendar } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <Hotel className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Hotel Manager</h1>
          </div>
          <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
            Sign In
          </Button>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Secure Hotel Guest Management
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional hotel management system with advanced security features, 
            role-based access control, and comprehensive booking management.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Enterprise-Grade Security Features
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with security-first principles to protect your hotel and guest data.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <span>Role-Based Access Control</span>
              </CardTitle>
              <CardDescription>
                Separate admin and guest permissions with secure authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-factor authentication (MFA)</li>
                <li>• Session management with secure cookies</li>
                <li>• Brute-force protection</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span>Secure Booking System</span>
              </CardTitle>
              <CardDescription>
                Protected reservation forms with comprehensive validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• CSRF token protection</li>
                <li>• SQL injection prevention</li>
                <li>• XSS attack mitigation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-primary" />
                <span>File Upload Security</span>
              </CardTitle>
              <CardDescription>
                Safe file handling with type validation and scanning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• File type and size validation</li>
                <li>• Malware scanning</li>
                <li>• Secure storage and access</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to secure your hotel operations?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of hotels using our secure management platform.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary/90"
          >
            Start Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
