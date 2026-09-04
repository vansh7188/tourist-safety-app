# 🌍 Globe Guard — Tourist Safety App

A comprehensive travel safety platform that keeps tourists safe while exploring unfamiliar destinations. Combines real-time AI assistance, peer-to-peer emergency help, voice-activated panic alerts, and a full admin command center — all in one mobile-first web app.

> **Live safety for travelers, powered by community and AI.**

---

## 🔥 What Makes This Project Unique

### 1. 🆘 Peer-to-Peer Emergency Helper Network (SOS Network)
Unlike traditional safety apps that only call authorities, Globe Guard creates a **real-time community rescue network**. When a traveler posts an emergency:
- Nearby online users receive **instant location-based alerts** via WebSocket
- Helpers can **accept the request**, view **live distance**, and open **Google Maps directions** to the person in need
- A **real-time chat channel** opens between the requester and all accepted helpers using Socket.IO
- Supports **photo/video attachments** uploaded to Cloudinary for visual context

### 2. 🎙️ Voice-Activated Panic System with Offline Queuing
The panic button goes beyond a simple tap:
- **Voice command detection** — say "panic" or "help" hands-free using the Web Speech API
- **Auto camera capture** — silently takes 3 photos on panic trigger for evidence
- **Offline-first architecture** — panic requests queue in localStorage when there's no network and **auto-sync** when connectivity returns
- **Multi-channel alerts** — simultaneously sends **SMS (Twilio)**, **email (Nodemailer)**, and **in-app notifications** to emergency contacts
- **Shareable panic reports** — share or copy panic details via the Web Share API

### 3. 🧠 Location-Aware AI Safety Chatbot
The chatbot isn't just a generic assistant:
- Powered by **Google Gemini API** with the user's **live GPS coordinates** injected into every query
- Returns **contextual safety advice** based on the user's actual location
- Surfaces **nearby places** (hospitals, police stations, embassies) with real addresses, distances, and **one-tap Google Maps directions**

### 4. 📡 Smart Area Safety Rating
A dynamic safety score that follows the traveler:
- Computes a **real-time area safety rating (1–5)** based on nearby alerts, severity, and distance
- Classifies alerts by type (danger, low network, info) with **severity levels**
- Shows **live GPS coordinates** and a configurable alert radius

### 5. 🛡️ Full Admin Command Center
A dedicated admin panel for authorities and safety personnel:
- **Real-time dashboard** with stats for total, pending, in-progress, resolved, critical, and high-priority panics
- **Advanced filtering** by status, priority, delivery source (direct vs. offline queue), with full-text search
- **Detailed panic view** with user KYC data (Aadhaar/passport), emergency contacts, location history, and captured photos
- **Role-based access** with JWT-protected admin routes

### 6. 🗺️ Live Location Tracking with Travel Path
The map doesn't just show where you are:
- **Tracks movement** from session start with start (green) and current (blue) markers
- Draws the **travel polyline** showing the path traveled
- **Sends live location to the server** every 15 seconds for last-known-location tracking
- **Reverse geocoding** provides full address details (state, district, city, postcode)

---

## ✨ Feature Summary

| Feature | Description |
|---|---|
| 🆘 Emergency Helper | Post emergencies, get matched with nearby helpers, real-time chat |
| 🚨 Panic Button | One-tap + voice-activated, camera capture, SMS/email/in-app alerts |
| 📴 Offline Queue | Panic requests save locally and auto-sync when back online |
| 🤖 AI Chatbot | Location-aware safety advice with nearby place directions |
| 📡 Safety Alerts | Area safety rating with live alert feed and severity classification |
| 🗺️ Live Map | Real-time tracking, travel path, 15s location updates to server |
| 🆔 Digital ID | Aadhaar/passport verification, emergency contact management |
| 🛡️ Admin Panel | Dashboard with stats, filters, search, panic detail view |
| 📸 Evidence Capture | Auto-captures photos on panic, uploads to Cloudinary |
| 📱 Mobile-First UI | Responsive design with bottom navigation, Tailwind CSS + Framer Motion |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB (Mongoose)** | Database with GeoJSON indexing for proximity queries |
| **Socket.IO** | Real-time WebSocket for emergency alerts and chat |
| **Google Gemini API** | AI-powered safety chatbot |
| **Twilio** | SMS alerts to emergency contacts |
| **Nodemailer** | Email notifications |
| **Cloudinary + Multer** | Media uploads (photos/videos) |
| **JWT + bcrypt** | Authentication and password hashing |
| **express-rate-limit** | API rate limiting |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19 + Vite 7** | SPA framework and dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Animations (panic button, transitions) |
| **Google Maps API** | Interactive maps, geocoding, directions |
| **Socket.IO Client** | Real-time emergency events and chat |
| **Web Speech API** | Voice-activated panic command |
| **Web Share API** | Native sharing of panic reports |

---

## 📁 Project Structure

```
tourist-safety-app/
├── backend/
│   ├── index.js                   # Express server, Socket.IO setup, routes
│   ├── adminRoutes.js             # Admin dashboard API (panics, stats, management)
│   ├── emergencyRoutes.js         # Emergency post, accept, chat, media upload
│   ├── DigitalidForm.js           # Digital ID, panic request, KYC routes
│   └── models/
│       ├── Profile.js             # User profile with location & emergency contacts
│       ├── panic.js               # Panic request schema (GeoJSON, KYC, contacts)
│       ├── panicMedia.js          # Panic evidence photos
│       ├── EmergencyPost.js       # Emergency helper posts (GeoJSON, responders)
│       ├── Message.js             # Chat messages for emergency channels
│       └── Admin.js               # Admin user schema
│
├── frontend/src/
│   ├── App.jsx                    # Route definitions
│   ├── pages/
│   │   ├── Home.jsx               # Landing page
│   │   ├── Login.jsx              # User authentication
│   │   ├── dashboard.jsx          # Main dashboard (map, chatbot, panic, alerts)
│   │   ├── Profile.jsx            # User profile page
│   │   ├── Pfile.jsx              # Profile file view
│   │   ├── EmergencyPage.jsx      # Emergency helper hub (post, sent, received)
│   │   ├── AdminLogin.jsx         # Admin authentication
│   │   ├── AdminDashboard.jsx     # Admin panic management dashboard
│   │   └── AdminPanicDetails.jsx  # Detailed panic request view
│   ├── components/
│   │   ├── Chatbot.jsx            # AI safety chatbot with place suggestions
│   │   ├── PanicButton.jsx        # Panic + voice + camera + offline queue
│   │   ├── MapComponent.jsx       # Live Google Map with path tracking
│   │   ├── EmergencyHelperForm.jsx# Post emergency with media
│   │   ├── EmergencyChat.jsx      # Real-time emergency chat (standalone)
│   │   ├── IncomingEmergencyAlert.jsx # Nearby emergency alerts with accept/chat
│   │   ├── SmartSafetyAlerts.jsx  # Area safety rating and alert feed
│   │   ├── SafetyAlertIndicator.jsx # Alert badge indicator
│   │   ├── DigitalidForm.jsx      # Digital ID creation/edit form
│   │   ├── MobileNavBar.jsx       # Bottom mobile navigation
│   │   ├── ProtectedAdminRoute.jsx# Admin route guard
│   │   └── AdminSidebar.jsx       # Admin navigation sidebar
│   └── context/
│       ├── TravelContext.jsx      # Travel state provider
│       ├── EmergencyContext.jsx    # Socket.IO + emergency alert state
│       ├── SafetyAlertsContext.jsx # Safety alerts provider
│       └── useEmergency.js        # Emergency context hook
│
├── package.json                   # Root package (concurrently dev script)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- npm
- MongoDB Atlas account
- Google Gemini API key
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Clanpe/tourist-safety-app.git
   cd tourist-safety-app
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file:
   ```env
   PORT=5000
   MONGO_URI2=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key

   # Optional — enable SMS alerts
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_number

   # Optional — enable email alerts
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASS=your_app_password

   # Optional — enable media uploads
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   Start the backend:
   ```bash
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   ```

   Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

   Start the frontend:
   ```bash
   npm run dev
   ```

4. **Access the app**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Admin panel: `http://localhost:5173/admin/login`

---

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register new user |
| POST | `/login` | Login user |
| POST | `/profile` | Create/update profile (protected) |
| PATCH | `/api/profile/location` | Update live location (protected) |

### AI Chatbot
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Send message with location context |

### Emergency Helper
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/emergency` | Post emergency with location + media |
| GET | `/api/emergency/mine` | Get user's sent emergency posts |
| GET | `/api/emergency/nearby` | Get nearby emergency posts |
| PATCH | `/api/emergency/:id/accept` | Accept an emergency request |
| GET | `/api/emergency/:id/messages` | Get chat messages for an emergency |

### Panic System
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/digitalid/panic` | Send panic request with KYC + location |
| POST | `/api/digitalid/panic-photos` | Upload panic evidence photos |
| DELETE | `/api/digitalid/panic/:id` | Delete a panic request |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/login` | Admin authentication |
| GET | `/api/admin/panics` | List all panics (filterable, sortable) |
| GET | `/api/admin/panics/:id` | Get panic details |
| DELETE | `/api/admin/panics/:id` | Delete resolved panic |
| GET | `/api/admin/stats/dashboard` | Dashboard statistics |

---

## 🔐 Security

- ✅ JWT token-based authentication (user + admin)
- ✅ Password hashing with bcrypt
- ✅ API rate limiting per endpoint
- ✅ Protected routes with auth middleware
- ✅ Environment variables for all secrets
- ✅ Role-based admin access control
- ✅ Multer file validation (image/video only, 20MB limit)
- ✅ MongoDB connection pooling

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚠️ Important Notes

- **API Keys:** Never commit `.env` files or credentials
- **Age Verification:** The app requires users to be 18+
- **Rate Limiting:** API requests are rate-limited to prevent abuse
- **HTTPS:** Use HTTPS in production
- **Offline Mode:** Panic requests queue locally and sync automatically when online

---

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Vansh** — Main Developer

## 📞 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Contact: vansh7188@gmail.com

---

**Stay Safe While Traveling! 🌐✈️**
