# Beach Atlas Greece 🇬🇷

A comprehensive web application for discovering and exploring the most beautiful beaches in Greece. Built with modern web technologies, this platform provides an intuitive way to search, filter, and explore Greek beaches with detailed information about amenities, locations, and Blue Flag certifications.

## 🌊 Live Application

**URL**: https://beachesofgreece.com/

## ✨ Features

### 🔍 Advanced Search & Discovery
- **Natural Language Search**: Search beaches using conversational queries
- **Smart Filtering**: Filter by location, amenities, beach type, wave conditions, and more
- **Geolocation Support**: Find beaches near your current location
- **Blue Flag Certification**: Filter for environmentally certified beaches
- **Distance Calculation**: Sort beaches by proximity to your location

### 🏖️ Beach Information
- **Comprehensive Details**: Photos, descriptions, amenities, and practical information
- **Area-based Organization**: Browse beaches by Greek regions and islands
- **Interactive Maps**: Visual beach locations with Leaflet integration
- **Accessibility Information**: Parking, organization status, and accessibility details

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Progressive Loading**: Fast image loading with skeleton states
- **SEO Optimized**: Structured data and meta tags for search engines
- **Accessibility**: WCAG compliant with screen reader support
- **Performance**: Optimized with service workers and caching

### 🔧 Admin Features
- **User Management**: Admin panel for user administration
- **Data Import/Export**: CSV import/export functionality for beach data
- **Content Management**: Add, edit, and manage beach information
- **Analytics**: Track user engagement and search patterns

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **PostgreSQL** - Relational database for beach data
- **Row Level Security** - Secure data access patterns

### Maps & Location
- **Leaflet** - Interactive maps
- **React Leaflet** - React integration for Leaflet
- **Geolocation API** - Browser location services

### State Management & Data Fetching
- **TanStack Query** - Server state management
- **React Router** - Client-side routing
- **React Hook Form** - Form handling with validation

### Natural Language Processing
- **Wink NLP** - Natural language processing for search
- **Compromise** - Text processing and analysis

### Development & Testing
- **Vitest** - Fast unit testing framework
- **ESLint** - Code linting and formatting
- **TypeScript ESLint** - TypeScript-specific linting rules

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd beach-atlas-greece
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase URL and API key to the environment file.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run generate-sitemap` - Generate sitemap for SEO

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   ├── breadcrumbs/    # Breadcrumb navigation
│   └── ui/             # Base UI components (shadcn/ui)
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility libraries
│   ├── nlp/            # Natural language processing
│   └── explanations/   # Search explanation logic
├── pages/              # Page components
│   └── admin/          # Admin pages
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🗄️ Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- **beaches** - Beach information, photos, amenities, and metadata
- **areas** - Greek regions and islands
- **admin_users** - Admin user management
- **admin_audit_log** - Admin action tracking
- **user_favorites** - User favorite beaches
- **search_analytics** - Search query analytics

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (optional)

### Supabase Setup
1. Create a new Supabase project
2. Run the migration files in `supabase/migrations/`
3. Set up Row Level Security policies
4. Configure authentication settings

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Lovable Platform**: Automatic deployment via Lovable
- **Vercel**: Static site deployment
- **Netlify**: Static site deployment
- **Custom Server**: Serve the `dist` folder

### Custom Domain
To connect a custom domain:
1. Navigate to Project > Settings > Domains
2. Click "Connect Domain"
3. Follow the DNS configuration instructions

## 📊 Performance & SEO

### Performance Optimizations
- **Image Optimization**: Progressive loading and WebP support
- **Code Splitting**: Lazy loading of components
- **Service Worker**: Offline functionality and caching
- **Bundle Optimization**: Tree shaking and minification

### SEO Features
- **Structured Data**: JSON-LD schema markup
- **Meta Tags**: Open Graph and Twitter Card support
- **Sitemap**: Auto-generated sitemap
- **Canonical URLs**: Proper URL canonicalization
- **Robots.txt**: Search engine directives

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Check the [FAQ page](https://beachesofgreece.com/faq)
- Review the [Guide](https://beachesofgreece.com/guide)
- Contact the development team

## 🔄 Development Workflow

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting
- Husky for git hooks (if configured)

### Git Workflow
- Feature branches for new development
- Pull requests for code review
- Automated testing on CI/CD
- Semantic versioning for releases

---

**Built with ❤️ for beach lovers and Greece enthusiasts**