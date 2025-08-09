import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Code,
  Settings,
  LogOut,
  Bell,
  Plus,
  Menu,
  X,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "../img/logoSvg.svg"
const navigation = [
  { name: "Categories", href: "/categories", icon: Package },
  { name: "Products", href: "/products", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Delivery", href: "/delivery", icon: Truck },
  
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const typedUser = user as User | undefined;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile close button */}
        <div className="lg:hidden absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
          <div>
              <h1 className="text-xl font-bold text-gray-900">
                <img src={Logo} />
              </h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
          </div>
          
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={typedUser?.profileImageUrl || ''} alt="Admin profile" />
              <AvatarFallback>
                {typedUser?.email?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {typedUser?.firstName && typedUser?.lastName 
                  ? `${typedUser.firstName} ${typedUser.lastName}`
                  : 'Admin User'
                }
              </p>
              <p className="text-xs text-gray-500">
                {typedUser?.email || 'admin@company.com'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              
              <div className="relative">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 p-2">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    0
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AdminLayout };
