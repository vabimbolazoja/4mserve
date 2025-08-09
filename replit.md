# E-Commerce Admin Dashboard

## Overview

This is a full-stack e-commerce admin dashboard application built with a React frontend and Express.js backend. The application provides comprehensive e-commerce functionality including product management, order processing, customer management, delivery management, and Stripe payment integration. It features Replit-based authentication, a PostgreSQL database with Drizzle ORM, and a modern UI built with shadcn/ui components and Tailwind CSS.

## Recent Updates (January 2025)

- **Added Authentication Pages**: Custom login and forgot password pages with modern UI design
- **Enhanced User Experience**: Added professional authentication flow with form validation and error handling
- **Added Delivery Management System**: Complete delivery and shipping management with carriers, delivery routes, tracking, and analytics
- **Enhanced Order Management**: Added tracking numbers, delivery dates, and carrier assignment to orders
- **Delivery Analytics**: Added comprehensive delivery performance analytics and reporting
- **User Management System**: Implemented comprehensive role-based access control with super admin, admin, manager, staff, and customer roles
- **Permission-Based Security**: Added granular permissions system with middleware protection for API routes
- **Security Improvements**: Made Stripe integration optional and improved error handling throughout the application

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** for server state management and API caching
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with CSS variables for theming
- **Stripe React components** for payment processing UI

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with structured route handlers
- **Session-based authentication** using Replit's OIDC provider
- **PostgreSQL session storage** with connect-pg-simple
- **Comprehensive error handling** with request/response logging middleware
- **Stripe server-side integration** for payment processing

### Database Design
- **PostgreSQL** database with **Drizzle ORM** for type-safe database operations
- **Neon Database** serverless PostgreSQL hosting
- **Schema-driven approach** with shared TypeScript types between frontend and backend
- **Migration system** using Drizzle Kit for database versioning

Key database tables:
- `sessions` - Session storage for authentication
- `users` - User profiles with role-based access control and Stripe integration
- `products` - Product catalog with inventory management
- `cartItems` - Shopping cart functionality
- `orders` and `orderItems` - Order management system with delivery tracking
- `carriers` - Shipping carrier management (UPS, FedEx, USPS, DHL, etc.)
- `deliveryRoutes` - Delivery route optimization and cost management
- `deliveryEvents` - Package tracking and delivery event logging

### Authentication & Authorization
- **Custom Authentication Pages** with modern, responsive design
- **Login interface** with form validation and error handling
- **Forgot password functionality** with email-based reset flow
- **Replit Auth** integration using OpenID Connect
- **Passport.js** with openid-client strategy
- **Role-based access control** with five distinct roles: super_admin, admin, manager, staff, customer
- **Granular permissions system** with endpoint-level access control
- **Permission middleware** protecting sensitive API routes
- **User management interface** for role assignment and access control
- **Session persistence** in PostgreSQL
- **Secure cookie configuration** with HTTP-only and secure flags

### Payment Processing
- **Stripe integration** for payment processing (optional - configurable)
- **Webhook support** for payment confirmations
- **Customer and subscription management** via Stripe
- **Payment Elements** for secure payment forms
- **Graceful fallback** when Stripe is not configured

### Delivery Management
- **Multi-carrier support** for UPS, FedEx, USPS, DHL, and custom carriers
- **Delivery route optimization** with cost and time estimates
- **Package tracking** with real-time delivery events
- **Delivery analytics** including on-time performance and carrier metrics
- **Automated tracking updates** when orders are shipped

### Development & Build
- **TypeScript** throughout the entire stack for type safety
- **Shared schema definitions** between client and server
- **Hot module replacement** in development via Vite
- **Production build optimization** with esbuild for server bundling
- **Path aliases** for clean import statements

### State Management
- **TanStack Query** for server state with intelligent caching
- **React hooks** for local component state
- **Form state management** with React Hook Form and Zod validation
- **Toast notifications** for user feedback

### UI/UX Design
- **Responsive design** with mobile-first approach
- **Dark/light theme support** via CSS variables
- **Accessible components** using Radix UI primitives
- **Professional admin interface** with sidebar navigation
- **Loading states and error handling** throughout the application

## External Dependencies

### Core Services
- **Replit Authentication** - OIDC-based user authentication and session management
- **Neon Database** - Serverless PostgreSQL database hosting
- **Stripe** - Payment processing, customer management, and subscriptions

### Frontend Libraries
- **@radix-ui** - Accessible UI component primitives
- **@tanstack/react-query** - Server state management and caching
- **@stripe/stripe-js** and **@stripe/react-stripe-js** - Stripe payment integration
- **wouter** - Lightweight React routing
- **tailwindcss** - Utility-first CSS framework
- **date-fns** - Date manipulation utilities

### Backend Libraries
- **express** - Web application framework
- **passport** and **openid-client** - Authentication middleware
- **drizzle-orm** and **@neondatabase/serverless** - Database ORM and connection
- **stripe** - Server-side Stripe integration
- **express-session** and **connect-pg-simple** - Session management

### Development Tools
- **vite** - Build tool and development server
- **typescript** - Type checking and compilation
- **drizzle-kit** - Database migration and introspection tools
- **esbuild** - JavaScript bundler for production builds