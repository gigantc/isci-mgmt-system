# ISCI Management System

A web application for managing ISCI (Industry Standard Coding Identification) codes for video editing projects.

## Features

- **Create & Edit ISCI Codes**: Generate and manage ISCI codes with validation
- **Track Projects**: Monitor status (Pending, In Progress, In Review, Completed, Archived)
- **Assign Editors**: Assign video editors to specific ISCI codes
- **Search & Filter**: Quick search across codes, advertisers, titles, and editors
- **Project Details**: Track duration, format, due dates, and completion status
- **Data Persistence**: JSON file-based storage (ready for database migration)

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Routing**: React Router v7
- **Styling**: Sass + TailwindCSS
- **Build Tool**: Vite
- **Data Storage**: JSON file (upgradeable to PostgreSQL/MySQL)

## Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── ISCIForm/       # Create/Edit form component
│   └── ISCIList/       # Table view component
├── containers/         # Container components
│   └── ISCIDashboard/  # Main dashboard container
├── routes/             # Route handlers
│   ├── home.tsx        # Home route
│   └── api.isci.ts     # API endpoint for ISCI data
├── types/              # TypeScript type definitions
│   └── isci.ts         # ISCI code types and enums
├── app.css             # Global styles
├── root.tsx            # Root component
└── routes.ts           # Route configuration

data/
└── isci-codes.json     # Data storage file
```

## Getting Started

### Installation

Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Building for Production

Create a production build:

```bash
npm run build
```

## ISCI Code Format

ISCI codes must follow the standard 8-character alphanumeric format (e.g., `NIKE0001`, `APPL0123`).

## Status Types

- **Pending**: Not yet started
- **In Progress**: Currently being worked on
- **In Review**: Under review
- **Completed**: Finished and approved
- **Archived**: Completed and archived

## API Endpoints

- `GET /api/isci` - Retrieve all ISCI codes
- `POST /api/isci` - Save ISCI codes

## Future Enhancements

- [ ] Database integration (PostgreSQL/MySQL)
- [ ] User authentication and authorization
- [ ] Multi-user collaboration features
- [ ] File attachment support
- [ ] Export to CSV/Excel
- [ ] Advanced filtering and sorting
- [ ] Dashboard analytics and reporting

## License

MIT
