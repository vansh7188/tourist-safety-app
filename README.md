# 🌍 Tourist Safety App

A comprehensive travel safety platform that helps tourists stay safe while exploring new destinations. Features real-time AI chatbot assistance, emergency panic alerts, digital ID verification, and travel planning tools.

## ✨ Key Features

### 🤖 **AI Safety Chatbot**
- Powered by Google Gemini API
- Real-time travel safety advice
- Answers about safe routes, emergency contacts, and suspicious situations
- Calm, practical guidance on travel security

### 🚨 **Emergency Panic Button**
- One-click emergency alerts
- Quick notification to trusted contacts
- Real-time location sharing

### 🆔 **Digital ID Verification**
- Secure user authentication
- Profile management with emergency contact details
- Age verification (18+)
- Contact information storage

### 🗺️ **Travel Planning & Maps**
- Interactive map integration
- Safe route recommendations
- Trip planning features
- Location-based safety information

### 👤 **User Profiles**
- Secure signup/login with JWT authentication
- Personal profile with emergency contacts
- Age verification (18+ requirement)
- Alternative contact storage

## 🛠️ Tech Stack

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas)
- **AI:** Google Gemini API
- **Authentication:** JWT + bcryptjs
- **Security:** Rate limiting, password hashing

### **Frontend**
- **Framework:** React + Vite
- **Styling:** CSS
- **Maps:** Interactive map components
- **Real-time:** WebSocket-ready architecture

## 🔐 Security Features

✅ Environment variables for sensitive data (`.env`)  
✅ Password hashing with bcryptjs  
✅ JWT token-based authentication  
✅ API rate limiting  
✅ Protected routes (authMiddleware)  
✅ MongoDB connection pooling  
✅ Secure API endpoints  

## 📁 Project Structure

```
sih_safety_web/
├── backend/
│   ├── index.js                 # Express server & API routes
│   ├── DigitalidForm.js         # Digital ID router logic
│   ├── models/
│   │   ├── Profile.js           # User profile schema
│   │   └── panic.js             # Panic alert schema
│   ├── package.json
│   └── .env                     # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── dashboard.jsx
│   │   │   └── Pfile.jsx
│   │   ├── components/
│   │   │   ├── Chatbot.jsx
│   │   │   ├── MapComponent.jsx
│   │   │   ├── PanicButton.jsx
│   │   │   ├── DigitalidForm.jsx
│   │   │   └── Dashboard components
│   │   ├── context/
│   │   │   └── TravelContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or later)
- npm or yarn
- MongoDB Atlas account
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Clanpe/tourist-safety-app.git
   cd tourist-safety-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   Create `.env` file:
   ```
   PORT=5000
   MONGO_URI2=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
   
   Start the backend:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the app**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

## 📚 API Endpoints

### **Authentication**
- `POST /signup` - Register new user
- `POST /login` - Login user
- `POST /profile` - Create/update user profile (Protected)

### **AI Chatbot**
- `POST /api/chat` - Send message to AI safety chatbot

### **Digital ID**
- `GET/POST /api/digitalid` - Manage digital ID (Protected)

## 🔒 Environment Variables

```env
# Server
PORT=5000

# Database
MONGO_URI2=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your_super_secret_key

# AI
GEMINI_API_KEY=your_google_gemini_api_key
```

## 🧪 Testing

To test the chatbot:
1. Sign up at the login page
2. Navigate to the dashboard
3. Open the chatbot component
4. Ask safety-related questions

## 📝 Usage Examples

### Sign Up
```bash
POST /signup
Content-Type: application/json

{
  "email": "tourist@example.com",
  "password": "SecurePassword123"
}
```

### Send Chat Message
```bash
POST /api/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What should I do if I'm lost in a foreign city?"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Important Notes

- **API Keys:** Never commit `.env` files or sensitive credentials
- **Age Verification:** The app requires users to be 18+ for safety reasons
- **Rate Limiting:** API requests are rate-limited to prevent abuse
- **HTTPS:** Use HTTPS in production for secure data transmission

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Authors

- **Vansh** - Main Developer

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- MongoDB Atlas for database services
- React and Express communities
- All contributors and testers

## 📞 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Contact: vansh7188@gmail.com

---

**Stay Safe While Traveling! 🌐✈️**
