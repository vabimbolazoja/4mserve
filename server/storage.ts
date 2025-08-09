import {
  users,
  products,
  cartItems,
  orders,
  orderItems,
  carriers,
  deliveryEvents,
  deliveryRoutes,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Carrier,
  type InsertCarrier,
  type DeliveryEvent,
  type InsertDeliveryEvent,
  type DeliveryRoute,
  type InsertDeliveryRoute,
  type CartItemWithProduct,
  type OrderWithItems,
  type OrderWithDelivery,
  type CarrierWithRoutes,
  type UserRole,
  type UserPermission,
  type UpdateUserRole,
  type UserWithPermissions,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  
  // User management operations
  getAllUsers(): Promise<User[]>;
  getUsersWithPermissions(): Promise<UserWithPermissions[]>;
  updateUserRole(userId: string, roleData: UpdateUserRole): Promise<User>;
  deactivateUser(userId: string): Promise<User>;
  reactivateUser(userId: string): Promise<User>;
  hasPermission(userId: string, permission: UserPermission): Promise<boolean>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  updateLastLogin(userId: string): Promise<User>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Cart operations
  getCartItems(userId: string): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Order operations
  getOrders(): Promise<OrderWithItems[]>;
  getUserOrders(userId: string): Promise<OrderWithItems[]>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  addOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  
  // Delivery management operations
  getCarriers(): Promise<Carrier[]>;
  getCarrier(id: string): Promise<Carrier | undefined>;
  createCarrier(carrier: InsertCarrier): Promise<Carrier>;
  updateCarrier(id: string, carrier: Partial<InsertCarrier>): Promise<Carrier>;
  deleteCarrier(id: string): Promise<void>;
  
  // Delivery events
  getDeliveryEvents(orderId: string): Promise<DeliveryEvent[]>;
  addDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent>;
  
  // Delivery routes
  getDeliveryRoutes(): Promise<DeliveryRoute[]>;
  getDeliveryRoutesByCarrier(carrierId: string): Promise<DeliveryRoute[]>;
  createDeliveryRoute(route: InsertDeliveryRoute): Promise<DeliveryRoute>;
  updateDeliveryRoute(id: string, route: Partial<InsertDeliveryRoute>): Promise<DeliveryRoute>;
  deleteDeliveryRoute(id: string): Promise<void>;
  
  // Order delivery operations
  updateOrderTracking(orderId: string, trackingNumber: string, carrierId?: string): Promise<Order>;
  updateOrderDeliveryDates(orderId: string, estimatedDate?: Date, actualDate?: Date): Promise<Order>;
  getOrderWithDelivery(orderId: string): Promise<OrderWithDelivery | undefined>;
  
  // Analytics
  getStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    conversionRate: number;
  }>;
  
  // Delivery analytics
  getDeliveryStats(): Promise<{
    totalShipments: number;
    onTimeDeliveries: number;
    averageDeliveryTime: number;
    topCarriers: Array<{ carrier: Carrier; shipmentCount: number }>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem> = new Map();
  private carriers: Map<string, Carrier> = new Map();
  private deliveryEvents: Map<string, DeliveryEvent> = new Map();
  private deliveryRoutes: Map<string, DeliveryRoute> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed admin users for testing
    this.users.set("admin", {
      id: "admin",
      email: "admin@example.com",
      firstName: "Super",
      lastName: "Admin",
      profileImageUrl: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      role: "super_admin",
      department: "Administration",
      permissions: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.set("manager", {
      id: "manager",
      email: "manager@example.com",
      firstName: "John",
      lastName: "Manager",
      profileImageUrl: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      role: "manager",
      department: "Sales",
      permissions: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.set("staff", {
      id: "staff",
      email: "staff@example.com",
      firstName: "Jane",
      lastName: "Staff",
      profileImageUrl: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      role: "staff",
      department: "Customer Service",
      permissions: null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed carriers
    const sampleCarriers: Carrier[] = [
      {
        id: "1",
        name: "UPS",
        code: "ups",
        trackingUrlTemplate: "https://www.ups.com/track?tracknum={trackingNumber}",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2", 
        name: "FedEx",
        code: "fedex",
        trackingUrlTemplate: "https://www.fedex.com/fedextrack/?trknbr={trackingNumber}",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "USPS",
        code: "usps",
        trackingUrlTemplate: "https://tools.usps.com/go/TrackConfirmAction?tLabels={trackingNumber}",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        name: "DHL",
        code: "dhl",
        trackingUrlTemplate: "https://www.dhl.com/en/express/tracking.html?AWB={trackingNumber}",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleCarriers.forEach(carrier => {
      this.carriers.set(carrier.id, carrier);
    });

    // Seed delivery routes
    const sampleRoutes: DeliveryRoute[] = [
      {
        id: "1",
        name: "UPS Ground",
        carrierId: "1",
        region: "US",
        estimatedDays: 3,
        cost: "9.99",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "UPS Next Day Air",
        carrierId: "1",
        region: "US",
        estimatedDays: 1,
        cost: "24.99",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "FedEx Ground",
        carrierId: "2",
        region: "US",
        estimatedDays: 3,
        cost: "8.99",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        name: "USPS Priority Mail",
        carrierId: "3",
        region: "US",
        estimatedDays: 2,
        cost: "7.99",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleRoutes.forEach(route => {
      this.deliveryRoutes.set(route.id, route);
    });

    // Seed some initial products
    const sampleProducts: Product[] = [
      {
        id: "1",
        name: "Wireless Headphones",
        description: "Premium noise-cancelling wireless headphones",
        price: "299.99",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        category: "Electronics",
        stock: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Smartphone Pro",
        description: "Latest flagship smartphone with advanced features",
        price: "899.99",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
        category: "Electronics",
        stock: 30,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Gaming Laptop",
        description: "High-performance gaming laptop",
        price: "1299.99",
        imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
        category: "Computers",
        stock: 15,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        name: "Smart Watch",
        description: "Advanced fitness tracking smartwatch",
        price: "399.99",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        category: "Wearables",
        stock: 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      ...userData,
      id: userData.id || randomUUID(),
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    } as User;
    
    this.users.set(user.id, user);
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId || null,
      updatedAt: new Date(),
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // User management operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersWithPermissions(): Promise<UserWithPermissions[]> {
    const users = Array.from(this.users.values());
    return users.map(user => ({
      ...user,
      computedPermissions: this.computeUserPermissions(user.role, user.permissions),
    }));
  }

  async updateUserRole(userId: string, roleData: UpdateUserRole): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      ...roleData,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deactivateUser(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      isActive: false,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async reactivateUser(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      isActive: true,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async hasPermission(userId: string, permission: UserPermission): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.isActive) return false;

    const permissions = this.computeUserPermissions(user.role, user.permissions);
    return permissions.includes(permission);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async updateLastLogin(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  private computeUserPermissions(role: string | null, customPermissions?: string[] | null): UserPermission[] {
    const rolePermissions: Record<string, UserPermission[]> = {
      super_admin: [
        'users.read', 'users.write', 'users.delete',
        'products.read', 'products.write', 'products.delete',
        'orders.read', 'orders.write', 'orders.delete',
        'delivery.read', 'delivery.write', 'delivery.delete',
        'analytics.read',
        'settings.read', 'settings.write',
        'customers.read', 'customers.write',
        'payments.read', 'payments.write'
      ],
      admin: [
        'users.read', 'users.write',
        'products.read', 'products.write', 'products.delete',
        'orders.read', 'orders.write', 'orders.delete',
        'delivery.read', 'delivery.write', 'delivery.delete',
        'analytics.read',
        'customers.read', 'customers.write',
        'payments.read', 'payments.write'
      ],
      manager: [
        'users.read',
        'products.read', 'products.write',
        'orders.read', 'orders.write',
        'delivery.read', 'delivery.write',
        'analytics.read',
        'customers.read', 'customers.write'
      ],
      staff: [
        'products.read',
        'orders.read', 'orders.write',
        'delivery.read', 'delivery.write',
        'customers.read'
      ],
      customer: [
        'orders.read'
      ]
    };

    const basePermissions = rolePermissions[role || 'customer'] || [];
    
    if (customPermissions && Array.isArray(customPermissions)) {
      // Merge custom permissions with role permissions, avoiding duplicates
      return [...new Set([...basePermissions, ...customPermissions])] as UserPermission[];
    }

    return basePermissions;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const product: Product = {
      ...productData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;
    
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) throw new Error("Product not found");
    
    const updated = {
      ...existing,
      ...productData,
      updatedAt: new Date(),
    } as Product;
    
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItemWithProduct[]> {
    const items = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
    
    return items.map(item => ({
      ...item,
      product: this.products.get(item.productId)!,
    })).filter(item => item.product);
  }

  async addToCart(itemData: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values())
      .find(item => item.userId === itemData.userId && item.productId === itemData.productId);
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += itemData.quantity;
      this.cartItems.set(existingItem.id, existingItem);
      return existingItem;
    }
    
    const item: CartItem = {
      ...itemData,
      id: randomUUID(),
      createdAt: new Date(),
    } as CartItem;
    
    this.cartItems.set(item.id, item);
    return item;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    const item = this.cartItems.get(id);
    if (!item) throw new Error("Cart item not found");
    
    item.quantity = quantity;
    this.cartItems.set(id, item);
    return item;
  }

  async removeFromCart(id: string): Promise<void> {
    this.cartItems.delete(id);
  }

  async clearCart(userId: string): Promise<void> {
    Array.from(this.cartItems.entries()).forEach(([id, item]) => {
      if (item.userId === userId) {
        this.cartItems.delete(id);
      }
    });
  }

  // Order operations
  async getOrders(): Promise<OrderWithItems[]> {
    return Array.from(this.orders.values()).map(order => this.enrichOrder(order));
  }

  async getUserOrders(userId: string): Promise<OrderWithItems[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .map(order => this.enrichOrder(order));
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    return order ? this.enrichOrder(order) : undefined;
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const order: Order = {
      ...orderData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Order;
    
    this.orders.set(order.id, order);
    return order;
  }

  async addOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const item: OrderItem = {
      ...itemData,
      id: randomUUID(),
    } as OrderItem;
    
    this.orderItems.set(item.id, item);
    return item;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    
    order.status = status;
    order.updatedAt = new Date();
    this.orders.set(id, order);
    return order;
  }

  private enrichOrder(order: Order): OrderWithItems {
    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === order.id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!,
      }));
    
    const user = this.users.get(order.userId)!;
    
    return {
      ...order,
      items,
      user,
    };
  }

  // Analytics
  async getStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    conversionRate: number;
  }> {
    const orders = Array.from(this.orders.values());
    const completedOrders = orders.filter(o => o.status === "delivered");
    
    const totalRevenue = completedOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount), 0);
    
    const totalOrders = orders.length;
    const activeCustomers = new Set(orders.map(o => o.userId)).size;
    const conversionRate = activeCustomers > 0 ? (completedOrders.length / activeCustomers) * 100 : 0;
    
    return {
      totalRevenue,
      totalOrders,
      activeCustomers,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  // Delivery management operations
  async getCarriers(): Promise<Carrier[]> {
    return Array.from(this.carriers.values()).filter(c => c.isActive);
  }

  async getCarrier(id: string): Promise<Carrier | undefined> {
    return this.carriers.get(id);
  }

  async createCarrier(carrierData: InsertCarrier): Promise<Carrier> {
    const carrier: Carrier = {
      ...carrierData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Carrier;
    
    this.carriers.set(carrier.id, carrier);
    return carrier;
  }

  async updateCarrier(id: string, carrierData: Partial<InsertCarrier>): Promise<Carrier> {
    const existing = this.carriers.get(id);
    if (!existing) throw new Error("Carrier not found");
    
    const updated = {
      ...existing,
      ...carrierData,
      updatedAt: new Date(),
    } as Carrier;
    
    this.carriers.set(id, updated);
    return updated;
  }

  async deleteCarrier(id: string): Promise<void> {
    this.carriers.delete(id);
  }

  // Delivery events
  async getDeliveryEvents(orderId: string): Promise<DeliveryEvent[]> {
    return Array.from(this.deliveryEvents.values())
      .filter(event => event.orderId === orderId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async addDeliveryEvent(eventData: InsertDeliveryEvent): Promise<DeliveryEvent> {
    const event: DeliveryEvent = {
      ...eventData,
      id: randomUUID(),
      timestamp: new Date(),
      createdAt: new Date(),
    } as DeliveryEvent;
    
    this.deliveryEvents.set(event.id, event);
    return event;
  }

  // Delivery routes
  async getDeliveryRoutes(): Promise<DeliveryRoute[]> {
    return Array.from(this.deliveryRoutes.values()).filter(r => r.isActive);
  }

  async getDeliveryRoutesByCarrier(carrierId: string): Promise<DeliveryRoute[]> {
    return Array.from(this.deliveryRoutes.values())
      .filter(route => route.carrierId === carrierId && route.isActive);
  }

  async createDeliveryRoute(routeData: InsertDeliveryRoute): Promise<DeliveryRoute> {
    const route: DeliveryRoute = {
      ...routeData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DeliveryRoute;
    
    this.deliveryRoutes.set(route.id, route);
    return route;
  }

  async updateDeliveryRoute(id: string, routeData: Partial<InsertDeliveryRoute>): Promise<DeliveryRoute> {
    const existing = this.deliveryRoutes.get(id);
    if (!existing) throw new Error("Delivery route not found");
    
    const updated = {
      ...existing,
      ...routeData,
      updatedAt: new Date(),
    } as DeliveryRoute;
    
    this.deliveryRoutes.set(id, updated);
    return updated;
  }

  async deleteDeliveryRoute(id: string): Promise<void> {
    this.deliveryRoutes.delete(id);
  }

  // Order delivery operations
  async updateOrderTracking(orderId: string, trackingNumber: string, carrierId?: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("Order not found");
    
    const updatedOrder = {
      ...order,
      trackingNumber,
      carrierId,
      updatedAt: new Date(),
    };
    
    this.orders.set(orderId, updatedOrder);
    
    // Add tracking event
    if (trackingNumber) {
      await this.addDeliveryEvent({
        orderId,
        status: "shipped",
        description: `Package shipped with tracking number: ${trackingNumber}`,
      });
    }
    
    return updatedOrder;
  }

  async updateOrderDeliveryDates(orderId: string, estimatedDate?: Date, actualDate?: Date): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("Order not found");
    
    const updatedOrder = {
      ...order,
      estimatedDeliveryDate: estimatedDate,
      actualDeliveryDate: actualDate,
      updatedAt: new Date(),
    };
    
    this.orders.set(orderId, updatedOrder);
    
    // Add delivery event if actually delivered
    if (actualDate) {
      await this.addDeliveryEvent({
        orderId,
        status: "delivered",
        description: `Package delivered successfully`,
      });
    }
    
    return updatedOrder;
  }

  async getOrderWithDelivery(orderId: string): Promise<OrderWithDelivery | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    
    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!,
      }));
    
    const user = this.users.get(order.userId)!;
    const carrier = order.carrierId ? this.carriers.get(order.carrierId) : undefined;
    const deliveryEvents = await this.getDeliveryEvents(orderId);
    
    return {
      ...order,
      items,
      user,
      carrier,
      deliveryEvents,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      trackingNumber: order.trackingNumber,
    };
  }

  // Delivery analytics
  async getDeliveryStats(): Promise<{
    totalShipments: number;
    onTimeDeliveries: number;
    averageDeliveryTime: number;
    topCarriers: Array<{ carrier: Carrier; shipmentCount: number }>;
  }> {
    const orders = Array.from(this.orders.values());
    const shippedOrders = orders.filter(o => o.trackingNumber);
    const deliveredOrders = orders.filter(o => o.actualDeliveryDate);
    
    // Calculate on-time deliveries
    const onTimeDeliveries = deliveredOrders.filter(order => {
      if (!order.estimatedDeliveryDate || !order.actualDeliveryDate) return false;
      return new Date(order.actualDeliveryDate) <= new Date(order.estimatedDeliveryDate);
    }).length;
    
    // Calculate average delivery time
    const deliveryTimes = deliveredOrders
      .filter(order => order.createdAt && order.actualDeliveryDate)
      .map(order => {
        const shipped = new Date(order.createdAt!);
        const delivered = new Date(order.actualDeliveryDate!);
        return (delivered.getTime() - shipped.getTime()) / (1000 * 60 * 60 * 24); // days
      });
    
    const averageDeliveryTime = deliveryTimes.length > 0 
      ? Math.round((deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) * 100) / 100 
      : 0;
    
    // Calculate top carriers
    const carrierCounts = new Map<string, number>();
    shippedOrders.forEach(order => {
      if (order.carrierId) {
        carrierCounts.set(order.carrierId, (carrierCounts.get(order.carrierId) || 0) + 1);
      }
    });
    
    const topCarriers = Array.from(carrierCounts.entries())
      .map(([carrierId, count]) => ({
        carrier: this.carriers.get(carrierId)!,
        shipmentCount: count,
      }))
      .filter(item => item.carrier)
      .sort((a, b) => b.shipmentCount - a.shipmentCount)
      .slice(0, 5);
    
    return {
      totalShipments: shippedOrders.length,
      onTimeDeliveries,
      averageDeliveryTime,
      topCarriers,
    };
  }
}

export const storage = new MemStorage();
