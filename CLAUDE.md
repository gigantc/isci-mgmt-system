# CLAUDE.md - ISCI Management System

This document provides context for AI assistants (like Claude) working on this project.

## Project Overview

The ISCI Management System is a web application for managing ISCI (Industry Standard Coding Identification) codes for video editing projects. It allows users to create, edit, track, and search ISCI codes with associated project metadata.

## Tech Stack

- **Framework**: React 19 with React Router v7
- **Language**: JavaScript (JSX) - No TypeScript
- **Styling**: Sass (SCSS) + TailwindCSS
- **Build Tool**: Vite
- **Server**: React Router SSR
- **Data Storage**: JSON file (`data/isci-codes.json`)

## Project Structure

```
isci-mgmt-system/
├── app/
│   ├── components/              # Reusable UI components
│   │   ├── ISCIForm/           # Form for creating/editing ISCI codes
│   │   │   ├── ISCIForm.jsx
│   │   │   ├── ISCIForm.scss
│   │   │   └── index.js
│   │   └── ISCIList/           # Table view for listing codes
│   │       ├── ISCIList.jsx
│   │       ├── ISCIList.scss
│   │       └── index.js
│   ├── containers/             # Container components with logic
│   │   └── ISCIDashboard/      # Main dashboard container
│   │       ├── ISCIDashboard.jsx
│   │       ├── ISCIDashboard.scss
│   │       └── index.js
│   ├── routes/                 # Route handlers
│   │   ├── api.isci.js         # API endpoint for CRUD operations
│   │   └── home.jsx            # Home page route
│   ├── types/                  # Type definitions (as constants)
│   │   └── isci.js             # ISCI status constants
│   ├── app.css                 # Global styles
│   ├── root.jsx                # Root component with layout
│   └── routes.js               # Route configuration
├── data/
│   └── isci-codes.json         # Data storage (50 test records)
├── public/                     # Static assets
├── package.json
├── vite.config.js
├── react-router.config.js
└── README.md
```

## Key Concepts

### ISCI Code Format
- Must be exactly 8 alphanumeric characters
- Example: `NIKE0001`, `APPL0123`, `COCA0045`
- Validated with regex: `/^[A-Z0-9]{8}$/`

### ISCI Status Types
Defined in `app/types/isci.js`:
- `PENDING` - Not yet started
- `IN_PROGRESS` - Currently being worked on
- `IN_REVIEW` - Under review
- `COMPLETED` - Finished and approved
- `ARCHIVED` - Completed and archived

### Data Structure
Each ISCI code object contains:
```javascript
{
  id: string,              // UUID
  code: string,            // 8-char ISCI code
  advertiser: string,
  title: string,
  description: string,     // Optional
  duration: number,        // In seconds, optional
  format: string,          // e.g., "1080p", "4K", optional
  assignedEditor: string,  // Optional
  status: string,          // One of ISCIStatus values
  createdAt: string,       // ISO timestamp
  updatedAt: string,       // ISO timestamp
  dueDate: string,         // ISO date, optional
  completedAt: string      // ISO timestamp, optional
}
```

## Important Patterns

### Component Organization
Each component/container lives in its own folder with:
- Main JSX file
- Corresponding SCSS file
- `index.js` barrel export

### No TypeScript
This project uses **pure JavaScript**. Do not add:
- Type annotations
- Interfaces
- TypeScript-specific syntax
- `.ts` or `.tsx` file extensions

### Import Style
Use extensionless imports (Vite resolves them):
```javascript
import ISCIForm from "../components/ISCIForm";  // ✅ Correct
import ISCIForm from "../components/ISCIForm.jsx";  // ❌ Don't add extension
```

### State Management
- Uses React hooks (`useState`, `useEffect`)
- No external state management library
- Local component state for forms
- Container components manage data flow

### Data Persistence
Currently uses JSON file storage:
- Read: `GET /api/isci` - Returns all codes
- Write: `POST /api/isci` - Saves entire array
- File location: `data/isci-codes.json`
- Uses Node.js `fs/promises` for file operations

## API Endpoints

### GET /api/isci
Returns all ISCI codes as JSON array.

**Handler**: `app/routes/api.isci.js` - `loader()` function

### POST /api/isci
Saves ISCI codes (full array replacement).

**Handler**: `app/routes/api.isci.js` - `action()` function

**Request Body**: Array of ISCI code objects

## Common Tasks

### Adding a New Component
1. Create folder: `app/components/ComponentName/`
2. Add `ComponentName.jsx` with component logic
3. Add `ComponentName.scss` for styles
4. Add `index.js` with: `export { default } from "./ComponentName";`

### Adding a New Route
1. Create route file in `app/routes/` (e.g., `about.jsx`)
2. Update `app/routes.js` to register the route
3. Use React Router v7 conventions (loader, action, meta functions)

### Modifying ISCI Data Structure
1. Update `data/isci-codes.json` test data
2. Update JSDoc comments or inline documentation
3. Update validation in `app/components/ISCIForm/ISCIForm.jsx`
4. Update display in `app/components/ISCIList/ISCIList.jsx`

### Styling Guidelines
- Use Sass (SCSS) for component-specific styles
- TailwindCSS available for utility classes
- Component styles are scoped to their SCSS files
- Global styles in `app/app.css`

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Future Enhancements (Roadmap)

- [ ] Database integration (PostgreSQL/MySQL)
- [ ] User authentication and authorization
- [ ] Multi-user collaboration
- [ ] File attachments for ISCI codes
- [ ] Export to CSV/Excel
- [ ] Advanced filtering and sorting
- [ ] Dashboard analytics and reporting
- [ ] Activity logs and audit trail
- [ ] Email notifications for due dates
- [ ] Batch operations (bulk edit/delete)

## Code Style

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Yes, use semicolons
- **Component naming**: PascalCase for components
- **File naming**: PascalCase for component files
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase

## Testing Data

The project includes 50 test ISCI codes in `data/isci-codes.json` with:
- Various advertisers (Nike, Apple, BMW, Netflix, etc.)
- Different editors (Sarah Johnson, Mike Chen, Lisa Park, David Lee)
- All status types represented
- Dates spread across Jan-Mar 2024
- Various durations (15s, 20s, 30s, 45s, 60s)
- Different formats (1080p, 4K)

## Important Notes

1. **No TypeScript**: This project was converted from TypeScript to JavaScript. Do not reintroduce TypeScript syntax.

2. **Data Storage**: Currently uses JSON file. When migrating to a database:
   - Keep the API endpoints the same
   - Only modify `app/routes/api.isci.js`
   - Consider adding error handling and validation

3. **ISCI Validation**: The 8-character format is enforced in the form validation. Ensure this remains consistent with industry standards.

4. **Component Structure**: Maintain the components/containers separation:
   - **Components**: Presentational, reusable UI elements
   - **Containers**: Business logic, data fetching, state management

5. **Sass/SCSS**: Use SCSS features (variables, nesting, mixins) when beneficial. Keep styles modular and component-scoped.

## Troubleshooting

### Dev Server Issues
If the dev server fails to start:
```bash
rm -rf .react-router node_modules/.vite
npm run dev
```

### Module Resolution Errors
- Ensure no `.js` or `.jsx` extensions in imports
- Check `vite.config.js` has correct extensions configured

### Data Not Persisting
- Check `data/isci-codes.json` exists and is writable
- Verify API endpoint is being called (check Network tab)
- Ensure file paths in `app/routes/api.isci.js` are correct

## Contact & Collaboration

This project is maintained for internal video editing workflow management. When working on this project:
- Follow existing patterns and conventions
- Keep code simple and maintainable
- Document significant changes
- Test thoroughly before committing

---

**Last Updated**: November 3, 2025
**Version**: 1.0.0
