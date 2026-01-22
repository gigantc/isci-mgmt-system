# ISCI Management System

A production-ready web application for managing ISCI (Industry Standard Coding Identification) codes for video editing projects. Features automatic code generation, brand management, user authentication, role-based access control, and CSV import/export.

🌐 **Live Demo**: http://54.158.87.192

## Features

### Core Functionality
- ✅ **Auto-Generated ISCI Codes**: Brand-based code generation (e.g., `LVCI2501`, `NIKE2515`)
- ✅ **Brand Management**: Manage brands with 4-letter codes for auto-generation
- ✅ **User Authentication**: Session-based login with admin/editor roles
- ✅ **Role-Based Access**: Admins have full access, editors have view-only
- ✅ **Project Tracking**: Monitor status (Pending, In Progress, In Review, Completed, Archived)
- ✅ **Recently Viewed**: Track last 5 viewed ISCI codes per user
- ✅ **Assigned Projects**: Dashboard shows user's assigned projects

### Data Management
- ✅ **CSV Import/Export**: Three import modes (add/update/replace) with validation
- ✅ **Advanced Filtering**: Filter by date, status, editor, brand, channel, spot length
- ✅ **Search**: Real-time search across codes, brands, titles, and editors
- ✅ **Profile Management**: Upload profile images, change passwords

### UI/UX
- ✅ **Dark Mode Theme**: Custom color palette with orange/red accents
- ✅ **CSS Grid Layout**: Modern, responsive table layout with sticky headers
- ✅ **Tabbed Interfaces**: Admin panel (Brands/Users), Reports (Export/Import)
- ✅ **Dashboard Boxes**: Recently Viewed, Assigned Projects, Recently Created

## Tech Stack

- **Framework**: React 19 with React Router v7 (SSR)
- **Language**: JavaScript (JSX) - No TypeScript
- **Styling**: Sass (SCSS) with CSS Modules
- **Build Tool**: Vite
- **Process Manager**: PM2 (production)
- **Web Server**: Nginx (reverse proxy)
- **Data Storage**: JSON files (ready for database migration)
- **Deployment**: AWS EC2 (Ubuntu 24.04 LTS)

## Project Structure

```
isci-mgmt-system/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── BrandManager/    # Brand CRUD with useResourceManager hook
│   │   ├── UserManager/     # User CRUD with useResourceManager hook
│   │   ├── AgencyManager/   # Agency CRUD with useResourceManager hook
│   │   ├── ProfileMenu/     # Profile dropdown menu
│   │   ├── ISCIForm/        # Create/Edit ISCI form with auto-generation
│   │   └── ISCIList/        # CSS Grid list with sorting
│   ├── containers/          # Container components with logic
│   │   ├── Dashboard/       # Main dashboard with search and boxes
│   │   ├── EditISCI/        # Edit/View ISCI code page
│   │   ├── Profile/         # User profile management
│   │   └── Header/          # Global header with navigation
│   ├── routes/              # Route handlers and API endpoints
│   │   ├── home.jsx         # Dashboard route
│   │   ├── create.jsx       # Create ISCI route (admin only)
│   │   ├── edit.jsx         # Edit/View ISCI route
│   │   ├── admin.jsx        # Admin panel (brands/users)
│   │   ├── reports.jsx      # Import/Export (admin only)
│   │   ├── profile.jsx      # User profile
│   │   ├── login.jsx        # Login page
│   │   └── api.*.js         # API endpoints
│   ├── hooks/               # Custom React hooks
│   │   ├── useFetchData.js         # Data fetching
│   │   ├── useResourceManager.js   # CRUD operations
│   │   ├── useExportData.js        # CSV export
│   │   └── useImportData.js        # CSV import
│   ├── styles/              # Global styles
│   │   ├── _variables.scss  # Theme colors
│   │   └── app.scss         # Global styles + buttons
│   └── utils/
│       └── auth.js          # Authentication helpers
├── data/                    # JSON data storage
│   ├── brands.json          # 15 brands
│   ├── users.json           # 9 users (1 admin, 8 editors)
│   └── isci-codes.json      # 100 test records
├── public/uploads/profiles/ # User profile images
├── ecosystem.config.cjs     # PM2 configuration
├── nginx.conf               # Nginx reverse proxy config
├── deploy.sh                # Automated deployment script
└── AWS_EC2_DEPLOYMENT.md    # Complete deployment guide
```

## Getting Started

### Local Development

**Prerequisites**: Node.js 20.x or higher

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Production Deployment

See [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md) for complete deployment guide.

**Quick deployment** (on server):
```bash
cd /var/www/isci-mgmt-system
./deploy.sh
```

## ISCI Code Format

**Auto-Generated Format**: `[BRAND][YEAR][NUMBER]`

Examples:
- `LVCI2501` - Las Vegas Convention, 2025, #1
- `NIKE2515` - Nike, 2025, #15
- `APPL25100` - Apple, 2025, #100

The system automatically:
1. Extracts brand's 4-letter code
2. Appends current 2-digit year
3. Finds highest existing number for that brand/year
4. Increments and zero-pads (2 digits for 1-99, 3 digits for 100+)

## User Roles

### Admin Users
- Full CRUD access to ISCI codes
- Access to Admin panel (brand/user management)
- Access to Reports page (import/export)
- Can create new ISCI codes

### Editor Users
- View-only access to ISCI codes
- Can view assigned projects
- Cannot create, edit, or delete codes
- No access to Admin or Reports pages

**Note**: Current authentication is POC only (sessionStorage, plain-text passwords in JSON).

## API Endpoints

### ISCI Codes
- `GET /api/isci` - Retrieve all codes
- `POST /api/isci` - Save codes
- `POST /api/isci/import` - Import from CSV

### Brands
- `GET /api/brands` - Retrieve all brands
- `POST /api/brands` - Save brands

### Users
- `POST /api/auth` - Login
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Save users (admin only)
- `PUT /api/user` - Update profile
- `POST /api/user/recently-viewed` - Track viewed codes

## Production Environment

### Deployment Details
- **Server**: AWS EC2 (Ubuntu 24.04 LTS)
- **Live URL**: http://54.158.87.192
- **Process Manager**: PM2 with auto-restart
- **Web Server**: Nginx (reverse proxy on port 80)
- **Node.js**: v20.20.0
- **Auto-start**: PM2 configured to start on server reboot

### Server Management

```bash
# View app status
pm2 status

# View logs
pm2 logs isci-mgmt

# Restart app
pm2 restart isci-mgmt

# Deploy updates
cd /var/www/isci-mgmt-system
./deploy.sh
```

See [AWS_QUICK_REFERENCE.md](AWS_QUICK_REFERENCE.md) for complete command reference.

## Development

### Code Style
- **Indentation**: 2 spaces
- **Quotes**: Double quotes
- **Semicolons**: Yes
- **Components**: PascalCase
- **CSS Modules**: camelCase class names
- **SCSS**: Use `@use` instead of `@import`

### Custom Hooks Pattern
The app uses custom hooks to eliminate code duplication:
- `useFetchData` - Data fetching with loading/error states
- `useResourceManager` - Complete CRUD lifecycle for managers
- `useExportData` - CSV export with filtering
- `useImportData` - CSV import with validation

See CLAUDE.md for detailed hook documentation.

## Roadmap

### Completed ✅
- [x] User authentication and authorization
- [x] Multi-user collaboration
- [x] Brand management system
- [x] CSV export with advanced filtering
- [x] CSV import with three modes
- [x] Role-based access control
- [x] Profile image uploads
- [x] Recently viewed tracking
- [x] Production deployment (AWS EC2)

### Planned 🔜
- [ ] Database migration (PostgreSQL/MySQL)
- [ ] SSL/HTTPS setup (Let's Encrypt)
- [ ] Automated backups to S3
- [ ] Agency management
- [ ] File attachments for ISCI codes
- [ ] Dashboard analytics and reporting
- [ ] Activity logs and audit trail
- [ ] Email notifications
- [ ] Batch operations (bulk edit/delete)
- [ ] Exportable slate feature (1920x1080 JPG)

## Documentation

- [CLAUDE.md](CLAUDE.md) - Complete technical documentation for AI assistants
- [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md) - Step-by-step deployment guide
- [AWS_QUICK_REFERENCE.md](AWS_QUICK_REFERENCE.md) - Quick command reference
- [DEPLOYMENT_FILES_README.md](DEPLOYMENT_FILES_README.md) - Deployment files overview

## Version

**Current Version**: 3.6.0-alpha (Phase 1 Refactoring)

## License

Proprietary - Badhawk Workshop

---

**Built with ❤️ by Dan Freeman**
