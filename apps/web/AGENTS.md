# AGENTS.md — Frontend (apps/web/)

**Scope**: Next.js 14 + TypeScript + Tailwind CSS + MUI. Read root `AGENTS.md` first.

## Architecture Overview

```
src/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home/Dashboard page
│   ├── login/              # Authentication pages
│   ├── assets/             # Asset management pages
│   ├── employees/          # Employee management pages
│   ├── locations/          # Location/Store management
│   └── reports/            # Analytics & reporting UI
├── components/             # Reusable UI components
│   ├── ui/                 # Base components (buttons, inputs, modals)
│   ├── forms/              # Form components with validation
│   ├── tables/             # Data table components
│   └── charts/             # Analytics visualization
├── lib/                    # Utilities & configurations
│   ├── api.ts              # API client setup
│   ├── auth.ts             # Authentication utilities
│   └── utils.ts            # Helper functions
├── types/                  # TypeScript type definitions
└── store/                  # State management (if using Zustand)
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + MUI v5 components
- **State**: TanStack Query for server state + Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js or Recharts for analytics
- **Icons**: Material UI Icons

## API Integration

- **Base URL**: `https://iam-tfba.onrender.com` (production) / `http://localhost:5000` (development)
- **Environment Variable**: `NEXT_PUBLIC_API_URL` set in Vercel dashboard
- **HTTP Client**: Fetch API with custom wrapper in `lib/api.ts`
- **Authentication**: JWT tokens stored in localStorage/sessionStorage

### API Client Pattern:
```typescript
// ❌ WRONG - Raw fetch in component
const Component = () => {
  useEffect(() => {
    fetch('/api/assets').then(res => res.json()).then(setData);
  }, []);
};

// ✅ CORRECT - TanStack Query hook
const Component = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.assets.getAll()
  });
};
```

## UI Component Standards

### Styling Guidelines:
- **Base styling**: Tailwind CSS classes for layout, spacing, colors
- **Complex components**: MUI components for advanced functionality (DataGrid, DatePicker, Autocomplete)
- **Typography**: MUI Typography component with consistent variants
- **Dark mode**: Support via Tailwind `dark:` classes + MUI theme provider

### Form Validation:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const assetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  serialNumber: z.string().optional(),
  categoryId: z.string().min(1, "Category is required")
});

export const AssetForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(assetSchema)
  });
  
  // Form implementation
};
```

## Local Development

```bash
# Setup
npm install

# Development server
npm run dev          # Starts on http://localhost:3000

# Build verification (same as Vercel)
npm run build
npm run start        # Test production build locally
```

## Production Deployment (Vercel)

- **Deploy Target**: [https://iam-api-sandy.vercel.app](https://iam-api-sandy.vercel.app)
- **Auto-deploy**: Connected to GitHub, deploys on push to main branch
- **Environment Variables**: Set in Vercel dashboard:
  ```
  NEXT_PUBLIC_API_URL=https://iam-tfba.onrender.com
  NEXTAUTH_URL=https://iam-api-sandy.vercel.app
  NEXTAUTH_SECRET=your-secret-key
  ```

## State Management Strategy

### Server State (API data):
- **TanStack Query**: For assets, employees, locations, reports
- **Optimistic Updates**: For frequently updated data
- **Background Refetch**: Keep data fresh automatically

### Client State (UI state):
- **Zustand**: For global UI state (auth, theme, navigation)
- **Local State**: React useState for component-specific state
- **Form State**: React Hook Form for all forms

## Type Safety

### API Response Types:
```typescript
// Mirror backend Prisma models
export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  serialNumber?: string;
  status: AssetStatus;
  category: AssetCategory;
  location: Location;
  employee?: Employee;
  createdAt: string;
  updatedAt: string;
}

// Keep types in sync with backend changes
```

## Frontend-Only Boundaries

✅ **Safe to modify**:
- `apps/web/src/` (all React components, pages, hooks)
- `apps/web/tailwind.config.js`, `next.config.js`
- `apps/web/package.json` (frontend dependencies)
- Frontend environment variables in Vercel

❌ **Do NOT touch**:
- `apps/api/` (Backend Express.js code)
- `apps/api/prisma/` (Database schema)
- Backend environment variables
- `render.yaml` or backend deploy config

## Asset Management UI Features

### Core Pages:
- **Dashboard**: Asset overview, recent activities, quick stats
- **Assets**: CRUD operations, search, filter, bulk actions
- **Employees**: Employee management, asset assignments
- **Locations**: Store/office management, asset distribution
- **Reports**: Analytics, asset utilization, audit reports
- **Maintenance**: Maintenance schedules, ticket management

### Data Tables:
- **Pagination**: Server-side for large datasets
- **Sorting**: Multi-column sorting support
- **Filtering**: Advanced filters for categories, status, locations
- **Export**: CSV/Excel export functionality

## Visual Standards

### Asset Cards:
- **Asset Status**: Color-coded badges (Available=green, In Use=blue, Maintenance=orange, Disposed=red)
- **Asset Images**: Placeholder support for future image uploads
- **QR Code**: Display QR codes for asset tracking

### Charts & Analytics:
- **Asset Distribution**: Pie charts by category, location, status
- **Trends**: Line charts for asset acquisition over time
- **Utilization**: Bar charts for asset usage by department

## Integration Points

### Backend Dependencies:
- **Authentication**: JWT tokens from `/api/auth/login`
- **Asset CRUD**: RESTful endpoints `/api/assets/*`
- **File Uploads**: Asset images, bulk import Excel files
- **Real-time Updates**: WebSocket for live asset status changes (future)

### Error Handling:
- **API Errors**: User-friendly error messages
- **Network Errors**: Offline handling, retry mechanisms
- **Form Validation**: Client-side + server-side validation alignment
- **Loading States**: Skeleton screens, progress indicators