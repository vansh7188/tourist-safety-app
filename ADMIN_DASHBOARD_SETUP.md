# Admin Dashboard Setup Guide

## Overview
The admin dashboard allows administrators to:
- Log in securely with JWT authentication
- View all panic requests with real-time data
- Search and filter panic requests by name, email, contact, or issue
- Arrange requests by priority (Critical, High, Medium, Low)
- Update panic status (Pending, In Progress, Resolved)
- Add admin notes to panic requests
- View comprehensive dashboard statistics
- Monitor response times and analytics

## Features

### 1. **Admin Authentication**
- Secure login system with JWT tokens
- Admin account management (Super Admin only)
- Role-based permissions
- Last login tracking

### 2. **Panic Request Management**
- View all panic requests in a sortable/filterable table
- Real-time statistics dashboard
- Priority indicators with visual badges
- Status management (Pending → In Progress → Resolved)

### 3. **Search & Filter**
- Search by: Name, Email, Contact Number, Issue/Query
- Filter by: Status, Priority
- Sort by: Created Date, Priority, Status, User Name
- Sort order: Newest First or Oldest First

### 4. **Panic Request Details**
- View full user information
- See emergency contacts
- View panic query and locations
- Real-time status and priority update
- Add admin notes
- Quick action buttons

## Installation & Setup

### Backend Setup

#### 1. Add Admin Routes Integration
The admin routes have been integrated into `backend/index.js`:
```javascript
import { createAdminRouter } from "./adminRoutes.js";
import Admin from "./models/Admin.js";

const adminRouter = createAdminRouter();
app.use("/api/admin", adminRouter);
```

#### 2. Seed Default Admin User
Run this command to create the default admin account:
```bash
cd backend
node seedAdmin.js
```

**Default Credentials:**
- Email: `admin@safe-travel.com`
- Password: `Admin@123`

⚠️ **Important:** Change this password after first login!

### Frontend Setup

#### 1. New Pages Created
- `/admin/login` - Admin login page
- `/admin/dashboard` - Main admin dashboard
- `/admin/panics/:id` - Panic request details

#### 2. Routes Added to App.jsx
```javascript
<Route path="admin/login" element={<AdminLogin />} />
<Route path="admin/dashboard" element={<AdminDashboard />} />
<Route path="admin/panics/:id" element={<AdminPanicDetails />} />
```

## API Endpoints

### Authentication
```
POST /api/admin/login
Body: { email, password }
Response: { token, admin: { id, email, name, role, permissions } }
```

### Panic Management (Requires Authentication)
```
GET /api/admin/panics
Query Params:
  - search: string (searches name, email, contact, query)
  - status: "pending" | "in_progress" | "resolved"
  - priority: "critical" | "high" | "medium" | "low"
  - sortBy: "createdAt" | "priority" | "status" | "name"
  - order: "asc" | "desc"
  - page: number (default: 1)
  - limit: number (default: 20)

GET /api/admin/panics/:id
Response: { data: panic_object }

PUT /api/admin/panics/:id/status
Body: { status, priority, notes, assignedTo }
Response: { message, data: updated_panic }
```

### Statistics
```
GET /api/admin/stats/dashboard
Response: { summary: {...}, recentPanics: [...] }

GET /api/admin/stats/analytics
Query Params:
  - days: number (default: 30)
Response: { panicsOverTime, priorityDistribution, statusDistribution, averageResolutionTimeMs }
```

## Data Models

### Admin Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: "super_admin" | "admin",
  permissions: {
    canViewPanics: Boolean,
    canUpdateStatus: Boolean,
    canManageAdmins: Boolean,
    canViewAnalytics: Boolean
  },
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Updated Panic Model
```javascript
{
  userId: ObjectId,
  email: String,
  name: String,
  contact_number: String,
  kyc: Object,
  emergency_contacts: Array,
  panic_query: String,
  locations: Array,
  
  // New fields:
  status: "pending" | "in_progress" | "resolved",
  priority: "critical" | "high" | "medium" | "low",
  notes: String,
  assignedTo: ObjectId (Admin reference),
  resolvedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Workflow

### 1. **Admin Login**
- Navigate to `/admin/login`
- Enter credentials
- Token stored in localStorage with expiry of 24 hours

### 2. **Dashboard Overview**
- View statistics cards (Total, Pending, In Progress, Resolved, Critical, High)
- See recent panic requests
- Use search and filters to find specific requests

### 3. **Search & Filter**
- **Search:** Type name, email, contact, or issue description
- **Filter by Status:** pending, in_progress, resolved
- **Filter by Priority:** critical, high, medium, low
- **Sort:** Choose sort field and order

### 4. **View panic Details**
- Click "View" button on any panic request
- See full user information, emergency contacts, locations
- View panic query details

### 5. **Update panic Status**
- On the details page, use the right sidebar form
- Update: Status, Priority, Notes
- Use quick action buttons for common actions:
  - "Mark High Priority" - Sets status to in_progress, priority to high
  - "Mark as Resolved" - Sets status to resolved

### 6. **Logout**
- Click logout button in header
- Session ends, token cleared

## Security

### JWT Authentication
- All admin routes require valid JWT token
- Tokens expire after 24 hours
- Use `Authorization: Bearer <token>` header

### Password Security
- Passwords hashed using bcryptjs (salt rounds: 10)
- Passwords never sent in responses
- Change default password immediately

### Permission System
- Role-based access control (super_admin vs admin)
- Different permission levels per role
- Granular permission checks on each endpoint

## Dashboard Statistics

### Cards Displayed
1. **Total Panics** - Total panic requests in system
2. **Pending** - Requests not yet addressed
3. **In Progress** - Requests being handled
4. **Resolved** - Completed requests
5. **Critical** - Unresolved critical priority requests
6. **High** - Unresolved high priority requests

### Analytics Available
- Panics over time (30 days default)
- Priority distribution
- Status distribution
- Average resolution time

## Troubleshooting

### Issues & Solutions

**1. "No token provided" error**
- Login again at `/admin/login`
- Check if token is stored in localStorage

**2. "Invalid email or password"**
- Verify credentials
- Check Admin collection in MongoDB

**3. Panic requests not showing**
- Verify database connection
- Check if panic requests exist in Panic collection
- Check user permissions

**4. Search not working**
- Ensure search term is not empty
- Check field names in database

## Frontend Components

### AdminLogin.jsx
- Login form with email and password
- Error handling and loading states
- Token storage in localStorage
- Redirect to dashboard on success

### AdminDashboard.jsx
- Statistics cards
- Search bar with real-time filtering
- Filter dropdowns (status, priority)
- Sortable table with pagination
- Responsive design

### AdminPanicDetails.jsx
- User information display
- Emergency contacts section
- Panic query and locations
- Status/priority update form
- Quick action buttons
- Admin notes textarea

## Environment Variables

Ensure these are set in `.env`:
```
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

## Files Modified/Created

### New Files Created:
- `backend/models/Admin.js` - Admin model with authentication
- `backend/adminRoutes.js` - Admin API routes
- `backend/seedAdmin.js` - Admin seeding script
- `frontend/src/pages/AdminLogin.jsx` - Login component
- `frontend/src/pages/AdminDashboard.jsx` - Dashboard component
- `frontend/src/pages/AdminPanicDetails.jsx` - Details page component

### Files Modified:
- `backend/models/panic.js` - Added status, priority, notes fields
- `backend/index.js` - Added admin routes integration
- `frontend/src/App.jsx` - Added admin routes

## Next Steps

1. Run `node seedAdmin.js` to create default admin
2. Start backend: `npm start` (in backend folder)
3. Start frontend: `npm run dev` (in frontend folder)
4. Navigate to `/admin/login`
5. Login with credentials and explore dashboard

## Support

For issues or questions, check:
- Console logs for errors
- MongoDB connection status
- JWT token validity
- User permissions in Admin document
