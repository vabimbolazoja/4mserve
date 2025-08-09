import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Shield, Zap, Users } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ECommerce</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
                Quick Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Complete ECommerce
            <span className="text-blue-600"> Backend Solution</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Secure, fast, and scalable ecommerce backend with authentication, payment processing, 
            order management, and comprehensive admin dashboard. Built for modern businesses.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                Sign In to Dashboard
              </Button>
            </Link>
            <Button onClick={handleLogin} size="lg" variant="outline" className="text-lg px-8 py-3">
              Quick Access
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Enterprise-grade authentication with session management and role-based access control.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Payment Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Integrated Stripe payments with support for one-time purchases and subscriptions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ShoppingCart className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete order lifecycle management from cart to delivery with real-time tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive admin interface for managing products, orders, customers, and analytics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* API Features */}
        <div className="mt-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">RESTful API Features</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Production-ready API endpoints with proper validation, error handling, and security.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Core Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-mono text-sm">GET</span>
                  <span className="text-gray-700">/api/products</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-mono text-sm">POST</span>
                  <span className="text-gray-700">/api/cart</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-mono text-sm">POST</span>
                  <span className="text-gray-700">/api/orders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-mono text-sm">POST</span>
                  <span className="text-gray-700">/api/create-payment-intent</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Session-based authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Input validation & sanitization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Role-based access control</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Secure error handling</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
