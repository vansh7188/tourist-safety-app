# 🚀 Admin Dashboard - Quick Start Guide

## What Was Built?

A complete **Admin Dashboard** for managing panic requests with:
✅ Secure admin login  
✅ Search & filter panic requests  
✅ Update panic status (Pending → In Progress → Resolved)  
✅ Arrange by priority (Critical, High, Medium, Low)  
✅ Real-time statistics  
✅ Admin notes management  
✅ Responsive design  

---

## 🔧 Installation (3 Steps)

### Step 1: Seed Default Admin Account
```bash
cd backend
node seedAdmin.js
```

**Default Login Credentials:**
- Email: `admin@safe-travel.com`
- Password: `Admin@123`

⚠️ Change password after first login!

### Step 2: Start Backend Server
```bash
cd backend
npm start
```
Server runs on `http://localhost:5000`

### Step 3: Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173` (default Vite port)

---

## 📋 How to Use

### 1. **Login**
- Go to `/admin/login`
- Enter credentials from Step 1
- You'll be redirected to the dashboard

### 2. **Dashboard Overview**
- See statistics: Total, Pending, In Progress, Resolved, Critical, High requests
- View recent panic requests at a glance

### 3. **Search & Filter**
- **Search**: Type name, email, phone, or issue description
- **Filter by Status**: Pending, In Progress, Resolved
- **Filter by Priority**: Critical, High, Medium, Low
- **Sort**: Choose field and order (newest/oldest first)

### 4. **View Request Details**
- Click "View" button on any request
- See full user information
- View emergency contacts
- Check panic location and query

### 5. **Update Status**
- On details page, use right sidebar
- Change status: Pending → In Progress → Resolved
- Change priority level
- Add admin notes
- Click "Update" to save

### 6. **Quick Actions**
- **Mark High Priority**: One-click to set high priority
- **Mark as Resolved**: One-click to resolve request

### 7. **Logout**
- Click logout button in header
- Session ends, back to login

---

## 📊 Dashboard Features

### Statistics Cards
| Card | Shows |
|------|-------|
| Total | Total panic requests |
| Pending | Waiting to be addressed |
| In Progress | Currently being handled |
| Resolved | Completed requests |
| Critical | Unresolved critical priority |
| High | Unresolved high priority |

### Panic Request Table
Shows all requests with:
- User name & email
- Contact number
- Issue/Query description
- Priority badge (colored)
- Status badge
- Date created
- View button

### Pagination
- Shows 10 requests per page
- Navigate with Previous/Next buttons
- Shows total count and current page

---

## 🔐 Security Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Password Hashing** - bcryptjs with salt rounds  
✅ **Role-Based Access** - Super admin vs admin roles  
✅ **Permission Checks** - Granular permission system  
✅ **24h Token Expiry** - Automatic session timeout  

---

## 📁 File Structure

### Backend
```
backend/
├── models/
│   ├── Admin.js (NEW)
│   ├── panic.js (UPDATED)
│   └── Profile.js
├── adminRoutes.js (NEW)
├── seedAdmin.js (NEW)
└── index.js (UPDATED)
```

### Frontend
```
frontend/src/
├── pages/
│   ├── AdminLogin.jsx (NEW)
│   ├── AdminDashboard.jsx (NEW)
│   ├── AdminPanicDetails.jsx (NEW)
│   └── App.jsx (UPDATED)
```

---

## 🛠️ API Endpoints

### Authentication
```
POST /api/admin/login
Body: { email, password }
```

### Panic Requests
```
GET /api/admin/panics
Query: search, status, priority, sortBy, order, page, limit

GET /api/admin/panics/:id
PUT /api/admin/panics/:id/status
Body: { status, priority, notes }
```

### Statistics
```
GET /api/admin/stats/dashboard
GET /api/admin/stats/analytics?days=30
```

---

## ✨ Key Features in Detail

### 1. **Real-time Search**
- Type and results filter instantly
- Searches across: name, email, contact, issue

### 2. **Priority Management**
- **Critical**: Red badge, needs immediate attention
- **High**: Orange badge, urgent
- **Medium**: Yellow badge, standard
- **Low**: Green badge, routine

### 3. **Status Tracking**
- **Pending**: Blue, just reported
- **In Progress**: Purple, being handled
- **Resolved**: Green, completed

### 4. **Admin Notes**
- Add internal notes to any panic request
- Visible only to admins
- Useful for team coordination

### 5. **Assignment Tracking**
- See which admin is assigned
- Track who handled the request
- Support multi-admin teams

---

## 🐛 Troubleshooting

### "No token provided" Error
→ Login again at `/admin/login`

### "Invalid email or password"
→ Check credentials match seeded admin
→ Verify MongoDB is running

### Panics not showing
→ Check database has panic requests
→ Verify backend is running
→ Check browser console for errors

### Search not working
→ Ensure search term isn't empty
→ Check field names are correct

---

## 📞 Default Admin Account

| Field | Value |
|-------|-------|
| Email | admin@safe-travel.com |
| Password | Admin@123 |
| Role | Super Admin |
| Status | Active |

**Create after first login:**
- Go to admin/register endpoint
- Create additional admin accounts
- Set role-based permissions

---

## 🎯 Next Steps

1. ✅ Run seedAdmin.js
2. ✅ Start backend & frontend
3. ✅ Login to admin dashboard
4. ✅ Test search/filter features
5. ✅ Create additional admin accounts
6. ✅ Customize default password
7. ✅ Set up admin permissions

---

## 📚 Documentation

Full documentation available in: `ADMIN_DASHBOARD_SETUP.md`

Includes:
- Detailed setup instructions
- API endpoint documentation
- Data model details
- Security information
- Analytics setup
- Troubleshooting guide

---

## ✅ Verification Checklist

- [ ] Admin seed script created
- [ ] Default admin account seeded
- [ ] Backend admin routes running
- [ ] Frontend pages accessible
- [ ] Login working
- [ ] Search/filter working
- [ ] Status updates working
- [ ] Statistics displaying
- [ ] Pagination working
- [ ] Responsive design verified

---

## 💡 Tips

✔️ **Change Password**: After first login, create new admin account with strong password  
✔️ **Multiple Admins**: Use admin registration endpoint to add team members  
✔️ **Backup**: Keep database backups of panic requests  
✔️ **Analytics**: Check analytics for insights on response times  
✔️ **Notes**: Use admin notes to coordinate with team members  

---

**Happy admin dashboard'ing! 🎉**
