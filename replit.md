# ModularFeasibility - Construction Assessment Platform

## Overview

ModularFeasibility is a professional assessment platform for multifamily developers to evaluate modular construction suitability for residential projects. The application provides comprehensive feasibility analysis through a 6-criteria scoring system, cost comparisons between modular and site-built construction, timeline analysis, and professional PDF reporting. Users can create projects by entering site details, unit mix requirements, and project specifications to receive detailed assessments covering zoning compliance, massing feasibility, cost analysis, sustainability considerations, logistics planning, and construction timeline comparisons.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based architecture with TypeScript for type safety. The client is built with Vite for fast development and optimized builds. The UI framework leverages shadcn/ui components built on Radix UI primitives for accessibility and consistent design patterns. State management is handled through TanStack Query for server state and React Hook Form for form management with Zod validation schemas. The styling system uses Tailwind CSS with custom CSS variables for theming, following a design system with predefined color schemes for the RaaP brand.

### Backend Architecture
The server implements a Node.js Express application using TypeScript and ES modules. The architecture follows a modular approach with separated concerns: route handlers in `/server/routes.ts`, database operations abstracted through a storage interface in `/server/storage.ts`, and authentication middleware in `/server/replitAuth.ts`. The application uses session-based authentication integrated with Replit's OpenID Connect system. API endpoints follow RESTful conventions with proper error handling and request logging middleware.

### Database Design
The data layer uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes user management tables required for Replit Auth integration, project tables storing feasibility assessment data, and cost breakdown tables for detailed financial analysis. Database migrations are managed through Drizzle Kit, and the schema is shared between client and server through the `/shared/schema.ts` file. The database connection uses Neon's serverless PostgreSQL with connection pooling.

### Authentication System
Authentication is implemented using Replit's OpenID Connect integration with session management. The system stores user sessions in PostgreSQL using connect-pg-simple for session persistence. Authentication middleware protects API routes and manages user context throughout the application. The frontend handles authentication state through React Query with automatic retry logic and unauthorized error handling.

### File Generation and Reporting
The application includes PDF generation capabilities using jsPDF for creating professional feasibility reports. The system generates comprehensive reports including project summaries, scoring breakdowns, cost analyses, and recommendations. Reports maintain consistent branding and formatting suitable for professional presentation to stakeholders.

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with connection pooling and automatic scaling
- **Drizzle ORM**: Type-safe database toolkit for schema management and query building

### Authentication Services
- **Replit Auth**: OpenID Connect authentication provider integrated with Replit's user system
- **connect-pg-simple**: PostgreSQL session store for maintaining user sessions

### UI and Styling Framework
- **shadcn/ui**: Component library built on Radix UI primitives for accessible and customizable components
- **Radix UI**: Low-level UI primitives for building design systems
- **Tailwind CSS**: Utility-first CSS framework for styling and responsive design
- **Lucide React**: Icon library providing consistent iconography throughout the application

### Frontend Libraries
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **React Hook Form**: Form library with validation and performance optimization
- **Zod**: Schema validation library for type-safe form validation and API request/response validation
- **Wouter**: Lightweight client-side routing library
- **jsPDF**: Client-side PDF generation for creating downloadable reports

### Development Tools
- **Vite**: Build tool providing fast development server and optimized production builds
- **TypeScript**: Static type checking for improved developer experience and code reliability
- **ESBuild**: Fast JavaScript bundler used by Vite for production builds