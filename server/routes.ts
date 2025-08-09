import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

import { 
  insertProductSchema, 
  insertCartItemSchema, 
  insertOrderSchema,
  insertCarrierSchema,
  insertDeliveryEventSchema,
  insertDeliveryRouteSchema,
  updateUserRoleSchema,
  type UserPermission,
} from "@shared/schema";
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path as needed
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

// Permission middleware
const requirePermission = (permission: UserPermission) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hasPermission = await storage.hasPermission(userId, permission);
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Update last login time
      if (user) {
        await storage.updateLastLogin(userId);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  //login

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Send success response
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed due to server error" });
  }
});

  // Password reset routes (simulated - in production would send actual emails)
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // In a real application, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send an email with the reset link
      
      // For demo purposes, we'll just return success
      res.json({ 
        message: "If an account with that email exists, you'll receive reset instructions.",
        success: true 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process password reset" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      // In a real application, you would:
      // 1. Validate the reset token
      // 2. Check if it's not expired
      // 3. Hash the new password
      // 4. Update the user's password in the database
      
      // For demo purposes, we'll just return success
      res.json({ 
        message: "Password has been reset successfully",
        success: true 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, requirePermission('users.read'), async (req, res) => {
    try {
      const users = await storage.getUsersWithPermissions();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/role/:role', isAuthenticated, requirePermission('users.read'), async (req, res) => {
    try {
      const role = req.params.role as any;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Failed to fetch users by role" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, requirePermission('users.write'), async (req, res) => {
    try {
      const userId = req.params.id;
      const roleData = updateUserRoleSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserRole(userId, roleData);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(400).json({ message: error.message || "Failed to update user role" });
    }
  });

  app.put('/api/users/:id/deactivate', isAuthenticated, requirePermission('users.write'), async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedUser = await storage.deactivateUser(userId);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error deactivating user:", error);
      res.status(400).json({ message: error.message || "Failed to deactivate user" });
    }
  });

  app.put('/api/users/:id/reactivate', isAuthenticated, requirePermission('users.write'), async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedUser = await storage.reactivateUser(userId);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error reactivating user:", error);
      res.status(400).json({ message: error.message || "Failed to reactivate user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requirePermission('users.delete'), async (req, res) => {
    try {
      const userId = req.params.id;
      
      // For safety, we deactivate instead of actually deleting
      await storage.deactivateUser(userId);
      res.json({ message: "User deactivated successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(400).json({ message: error.message || "Failed to delete user" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, requirePermission('products.write'), async (req: any, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: error.message || "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, requirePermission('products.write'), async (req: any, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: error.message || "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, requirePermission('products.delete'), async (req: any, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(400).json({ message: error.message || "Failed to delete product" });
    }
  });

  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: error.message || "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      res.json(cartItem);
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      res.status(400).json({ message: error.message || "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      res.status(400).json({ message: error.message || "Failed to remove from cart" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      let orders;
      
      if (user?.role === 'admin') {
        orders = await storage.getOrders();
      } else {
        orders = await storage.getUserOrders(req.user.claims.sub);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin' && order.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total amount
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0);

      // Create order
      const orderData = insertOrderSchema.parse({
        userId,
        totalAmount: totalAmount.toString(),
        status: "pending",
        shippingAddress: req.body.shippingAddress,
      });

      const order = await storage.createOrder(orderData);

      // Add order items
      for (const cartItem of cartItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.product.price,
        });
      }

      // Clear cart
      await storage.clearCart(userId);

      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(400).json({ message: error.message || "Failed to update order status" });
    }
  });

  // Customer routes (admin only)
  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // For in-memory storage, we'll return empty array for now
      // In real implementation, this would fetch all customers
      res.json([]);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Analytics routes (admin only)
  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Delivery management routes
  
  // Carriers
  app.get('/api/carriers', isAuthenticated, async (req: any, res) => {
    try {
      const carriers = await storage.getCarriers();
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ message: "Failed to fetch carriers" });
    }
  });

  app.post('/api/carriers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertCarrierSchema.parse(req.body);
      const carrier = await storage.createCarrier(validatedData);
      res.status(201).json(carrier);
    } catch (error: any) {
      console.error("Error creating carrier:", error);
      res.status(400).json({ message: error.message || "Failed to create carrier" });
    }
  });

  app.put('/api/carriers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const carrier = await storage.updateCarrier(req.params.id, req.body);
      res.json(carrier);
    } catch (error: any) {
      console.error("Error updating carrier:", error);
      res.status(400).json({ message: error.message || "Failed to update carrier" });
    }
  });

  app.delete('/api/carriers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteCarrier(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting carrier:", error);
      res.status(400).json({ message: error.message || "Failed to delete carrier" });
    }
  });

  // Delivery routes
  app.get('/api/delivery-routes', isAuthenticated, async (req: any, res) => {
    try {
      const routes = await storage.getDeliveryRoutes();
      res.json(routes);
    } catch (error) {
      console.error("Error fetching delivery routes:", error);
      res.status(500).json({ message: "Failed to fetch delivery routes" });
    }
  });

  app.get('/api/carriers/:carrierId/routes', isAuthenticated, async (req: any, res) => {
    try {
      const routes = await storage.getDeliveryRoutesByCarrier(req.params.carrierId);
      res.json(routes);
    } catch (error) {
      console.error("Error fetching carrier routes:", error);
      res.status(500).json({ message: "Failed to fetch carrier routes" });
    }
  });

  app.post('/api/delivery-routes', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertDeliveryRouteSchema.parse(req.body);
      const route = await storage.createDeliveryRoute(validatedData);
      res.status(201).json(route);
    } catch (error: any) {
      console.error("Error creating delivery route:", error);
      res.status(400).json({ message: error.message || "Failed to create delivery route" });
    }
  });

  // Order tracking and delivery
  app.put('/api/orders/:id/tracking', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { trackingNumber, carrierId } = req.body;
      const order = await storage.updateOrderTracking(req.params.id, trackingNumber, carrierId);
      res.json(order);
    } catch (error: any) {
      console.error("Error updating order tracking:", error);
      res.status(400).json({ message: error.message || "Failed to update tracking" });
    }
  });

  app.put('/api/orders/:id/delivery', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { estimatedDeliveryDate, actualDeliveryDate } = req.body;
      const estimatedDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined;
      const actualDate = actualDeliveryDate ? new Date(actualDeliveryDate) : undefined;
      
      const order = await storage.updateOrderDeliveryDates(req.params.id, estimatedDate, actualDate);
      res.json(order);
    } catch (error: any) {
      console.error("Error updating delivery dates:", error);
      res.status(400).json({ message: error.message || "Failed to update delivery dates" });
    }
  });

  app.get('/api/orders/:id/delivery', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const order = await storage.getOrderWithDelivery(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions
      if (user?.role !== 'admin' && order.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error: any) {
      console.error("Error fetching order delivery:", error);
      res.status(500).json({ message: "Failed to fetch order delivery" });
    }
  });

  // Delivery events
  app.get('/api/orders/:id/events', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions
      if (user?.role !== 'admin' && order.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const events = await storage.getDeliveryEvents(req.params.id);
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching delivery events:", error);
      res.status(500).json({ message: "Failed to fetch delivery events" });
    }
  });

  app.post('/api/orders/:id/events', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertDeliveryEventSchema.parse({
        ...req.body,
        orderId: req.params.id,
      });
      
      const event = await storage.addDeliveryEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      console.error("Error adding delivery event:", error);
      res.status(400).json({ message: error.message || "Failed to add delivery event" });
    }
  });

  // Delivery analytics
  app.get('/api/analytics/delivery', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getDeliveryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching delivery stats:", error);
      res.status(500).json({ message: "Failed to fetch delivery stats" });
    }
  });

  // Stripe payment routes (only if Stripe is configured)
  if (stripe) {
    app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
      try {
        const { amount } = req.body;
        const paymentIntent = await stripe!.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });
  } else {
    app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
      res.status(503).json({ message: "Payment processing not configured. Please add Stripe API keys." });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
