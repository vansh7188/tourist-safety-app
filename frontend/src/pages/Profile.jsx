import React, { useState } from "react";
import axios from "axios";

function ProfileForm() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    altContact: "",
    gender: "",
    age: "",
  });

  const [emailOTP, setEmailOTP] = useState("");
  const [contactOTP, setContactOTP] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [contactVerified, setContactVerified] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Send Email OTP
  const sendEmailOTP = async () => {
    try {
      await axios.post(`${API_BASE_URL}/send-email-otp`, { email: form.email });
      alert("OTP sent to email");
    } catch (err) {
      console.log(err);
    }
  };

  // Verify Email OTP
  const verifyEmailOTP = async () => {
    try {
      await axios.post(`${API_BASE_URL}/verify-email-otp`, { email: form.email, otp: emailOTP });
      alert("Email verified!");
      setEmailVerified(true);
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  // Send Contact OTP
  const sendContactOTP = async () => {
    try {
      await axios.post(`${API_BASE_URL}/send-contact-otp`, { contact: form.contact });
      alert("OTP sent to contact");
    } catch (err) {
      console.log(err);
    }
  };

  // Verify Contact OTP
  const verifyContactOTP = async () => {
    try {
      await axios.post(`${API_BASE_URL}/verify-contact-otp`, { contact: form.contact, otp: contactOTP });
      alert("Contact verified!");
      setContactVerified(true);
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  // Submit profile
  const submitProfile = async () => {
    if (!emailVerified || !contactVerified) {
      alert("Please verify email and contact first");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/profile`, form);
      alert("Profile saved successfully");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-6 bg-gradient-to-r from-indigo-500 via--500 to-white-500">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-purple-300 relative">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-red-600 drop-shadow-lg">
           Profile Arena
        </h2>

        {/* Input Fields */}
        <input
          type="text"
          name="name"
          placeholder="👤 Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 mb-4 border-2 border-transparent focus:border-indigo-500 rounded-xl shadow-md focus:shadow-lg outline-none transition-all duration-300"
        />

        {/* Email Section */}
        <div className="mb-4">
          <input
            type="email"
            name="email"
            placeholder="📧 Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border-2 border-transparent focus:border-indigo-500 rounded-xl shadow-md focus:shadow-lg outline-none transition-all duration-300"
          />
          {!emailVerified && (
            <div className="flex gap-2 mt-2">
              <button onClick={sendEmailOTP} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg shadow-md transition">
                Send OTP
              </button>
              <input
                type="text"
                placeholder="Enter OTP"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                className="border p-2 rounded-lg flex-1 outline-none shadow-sm"
              />
              <button onClick={verifyEmailOTP} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg shadow-md transition">
                Verify
              </button>
            </div>
          )}
          {emailVerified && <span className="text-green-600 font-semibold text-sm mt-2 block">✅ Email Verified</span>}
        </div>

        {/* Contact Section */}
        <div className="mb-4">
          <input
            type="text"
            name="contact"
            placeholder="📱 Contact Number"
            value={form.contact}
            onChange={handleChange}
            className="w-full p-3 border-2 border-transparent focus:border-indigo-500 rounded-xl shadow-md focus:shadow-lg outline-none transition-all duration-300"
          />
          {!contactVerified && (
            <div className="flex gap-2 mt-2">
              <button onClick={sendContactOTP} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg shadow-md transition">
                Send OTP
              </button>
              <input
                type="text"
                placeholder="Enter OTP"
                value={contactOTP}
                onChange={(e) => setContactOTP(e.target.value)}
                className="border p-2 rounded-lg flex-1 outline-none shadow-sm"
              />
              <button onClick={verifyContactOTP} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg shadow-md transition">
                Verify
              </button>
            </div>
          )}
          {contactVerified && <span className="text-green-600 font-semibold text-sm mt-2 block">✅ Contact Verified</span>}
        </div>

        <input
          type="text"
          name="altContact"
          placeholder="📞 Alternate Contact Number"
          value={form.altContact}
          onChange={handleChange}
          className="w-full p-3 mb-4 border-2 border-transparent focus:border-indigo-500 rounded-xl shadow-md focus:shadow-lg outline-none transition-all duration-300"
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full p-3 mb-4 border-2 border-transparent focus:border-indigo-500 rounded-xl shadow-md focus:shadow-lg outline-none transition-all duration-300"
        >
          <option value="">⚧ Select Gender</option>
          <option value="Male">♂ Male</option>
          <option value="Female">♀ Female</option>
          <option value="Other">⚧ Other</option>
        </select>

        <input
          type="number"
          name="age"
          placeholder="🎂 Age (18+)"
          min="18"
          value={form.age}
          onChange={handleChange}
          className="w-full p-3 mb-6 border-2 border-transparent focus:border-indigo-500 rounded-xl shadow-md focus:shadow-lg outline-none transition-all duration-300"
        />

        {/* Save Button */}
        <button
          onClick={submitProfile}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-105 hover:shadow-2xl transition transform duration-300"
        >
          🚀 Save Profile
        </button>
      </div>
    </div>
  );
}

export default ProfileForm;
