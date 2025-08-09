import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product, Order } from "@shared/schema";
import AdminLayout from "@/components/admin-layout";
import StatCard from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Receipt,
  Package,
  Activity,
  BarChart3,
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    conversionRate: number;
  }>({
    queryKey: ["/api/analytics/stats"],
    retry: false,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const recentOrders = (orders || []).slice(0, 5);
  const topProducts = (products?.products || []).slice(0, 4);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`$${stats?.totalRevenue?.toLocaleString() || '0'}`}
            change=""
            changeType="positive"
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-100"
            loading={statsLoading}
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders?.toLocaleString() || '0'}
            change=""
            changeType="positive"
            icon={ShoppingCart}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
            loading={statsLoading}
          />
          <StatCard
            title="Active Customers"
            value={stats?.activeCustomers?.toLocaleString() || '0'}
            change=""
            changeType="negative"
            icon={Users}
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
            loading={statsLoading}
          />
          <StatCard
            title="Guest Users"
            value={`${stats?.conversionRate || '0'}%`}
            change=""
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBg="bg-orange-100"
            loading={statsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart Placeholder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revenue Analytics</CardTitle>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <BarChart3 className="mx-auto text-gray-400 text-3xl mb-2" size={48} />
                    <p className="text-gray-500">Revenue Chart Integration</p>
                    <p className="text-sm text-gray-400">Chart.js or similar visualization library</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product) => (
                    <div key={product.id} className="flex items-center space-x-3">
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                      </div>
                      <p className="font-semibold text-gray-900">${product.priceUsd} N{product?.priceNaira}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle>Recent Orders</CardTitle>
              <a href="/orders" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                View all
              </a>
            </CardHeader>
            <CardContent className="p-6">
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                        <div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-16" />
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Receipt className="text-blue-600 text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">{order.user?.email || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${order.totalAmount}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto mb-4" size={48} />
                  <p>No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>

       
        </div>
      </div>
    </AdminLayout>
  );
}
