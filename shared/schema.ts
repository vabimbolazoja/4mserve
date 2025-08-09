import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  decimal,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  role: varchar("role").default("customer"), // super_admin, admin, manager, staff, customer
  department: varchar("department"), // sales, logistics, customer_service, finance, etc.
  permissions: jsonb("permissions"), // specific permissions array
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  category: varchar("category"),
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  shippingAddress: jsonb("shipping_address"),
  trackingNumber: varchar("tracking_number"),
  carrierId: varchar("carrier_id").references(() => carriers.id),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  deliveryInstructions: text("delivery_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Carriers table for delivery management
export const carriers = pgTable("carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // UPS, FedEx, DHL, USPS, etc.
  code: varchar("code").notNull().unique(), // ups, fedex, dhl, usps
  trackingUrlTemplate: varchar("tracking_url_template"), // URL template with {trackingNumber} placeholder
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Delivery tracking events
export const deliveryEvents = pgTable("delivery_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  status: varchar("status").notNull(), // shipped, in_transit, out_for_delivery, delivered, exception
  location: varchar("location"),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery routes for optimization
export const deliveryRoutes = pgTable("delivery_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  carrierId: varchar("carrier_id").references(() => carriers.id),
  region: varchar("region"), // geographical region or postal codes
  estimatedDays: integer("estimated_days").default(0), // estimated delivery days
  cost: decimal("cost", { precision: 10, scale: 2 }), // shipping cost
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliveryEventSchema = createInsertSchema(deliveryEvents).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryRouteSchema = createInsertSchema(deliveryRoutes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Role permissions schema
export const userRoleSchema = z.enum(['super_admin', 'admin', 'manager', 'staff', 'customer']);
export const userPermissionSchema = z.enum([
  'users.read', 'users.write', 'users.delete',
  'products.read', 'products.write', 'products.delete',
  'orders.read', 'orders.write', 'orders.delete',
  'delivery.read', 'delivery.write', 'delivery.delete',
  'analytics.read',
  'settings.read', 'settings.write',
  'customers.read', 'customers.write',
  'payments.read', 'payments.write'
]);

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
  department: z.string().optional(),
  permissions: z.array(userPermissionSchema).optional(),
  isActive: z.boolean().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;
export type Carrier = typeof carriers.$inferSelect;
export type InsertDeliveryEvent = z.infer<typeof insertDeliveryEventSchema>;
export type DeliveryEvent = typeof deliveryEvents.$inferSelect;
export type InsertDeliveryRoute = z.infer<typeof insertDeliveryRouteSchema>;
export type DeliveryRoute = typeof deliveryRoutes.$inferSelect;

// Extended types with relations
export type CartItemWithProduct = CartItem & {
  product: Product;
};

export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
  user: User;
  carrier?: Carrier;
  deliveryEvents?: DeliveryEvent[];
};

export type CarrierWithRoutes = Carrier & {
  routes: DeliveryRoute[];
};

export type OrderWithDelivery = Order & {
  items: (OrderItem & { product: Product })[];
  user: User;
  carrier?: Carrier;
  deliveryEvents: DeliveryEvent[];
  estimatedDeliveryDate?: Date;
  trackingNumber?: string;
};

// User management types
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserPermission = z.infer<typeof userPermissionSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;

export type UserWithPermissions = User & {
  computedPermissions: UserPermission[];
};
