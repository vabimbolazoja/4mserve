import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import Delivery from "@/pages/delivery";
import Customers from "@/pages/customers";
import Checkout from "@/pages/checkout";
import Users from "@/pages/users";
import Categories from "@/pages/categories";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log(isAuthenticated, isLoading)

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Orders} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
        </>
      ) : (
        <>
          <Route path="/" component={Orders} />
          <Route path="/products" component={Products} />
          <Route path="/orders" component={Orders} />
          <Route path="/delivery" component={Delivery} />
          <Route path="/categories" component={Categories} />
          <Route path="/customers" component={Customers} />
          <Route path="/users" component={Users} />
          <Route path="/checkout" component={Checkout} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
