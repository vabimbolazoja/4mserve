import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/admin-layout";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your purchase!",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <Button 
            type="submit" 
            disabled={!stripe || !elements}
            className="w-full"
          >
            Pay Now
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [isStripeConfigured] = useState(!!import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isStripeConfigured || !isAuthenticated || clientSecret) {
      return;
    }

    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { amount: 100 }) // $1.00 test amount
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setPaymentError("Payment processing is not configured. Please contact an administrator.");
        }
      })
      .catch((error) => {
        setPaymentError("Payment processing is not configured. Please contact an administrator.");
      });
  }, [isAuthenticated, clientSecret, isStripeConfigured]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isStripeConfigured || paymentError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Payment Processing</h2>
            <p className="text-gray-600">Secure checkout system</p>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Payment Setup Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Stripe payment processing needs to be configured by an administrator to enable checkout functionality.
                </p>
                <p className="text-sm text-gray-500">
                  Contact your system administrator to set up payment processing with Stripe API keys.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!clientSecret) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <p className="text-gray-600">Complete your payment securely</p>
        </div>
        
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      </div>
    </AdminLayout>
  );
}
