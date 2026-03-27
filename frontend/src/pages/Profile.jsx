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
    <div className="min-h-screen flex justify-center items-center px-6 py-10 app-shell">
      <div className="w-full max-w-2xl section-card p-8 md:p-10">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Safe Travel
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold section-title">
            Profile Arena
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Verify your contact details to unlock safety features.
          </p>
        </div>

        {/* Input Fields */}
        <input
          type="text"
          name="name"
          placeholder="👤 Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-3 mb-4 border border-white/60 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none transition"
        />

        {/* Email Section */}
        <div className="mb-5">
          <input
            type="email"
            name="email"
            placeholder="📧 Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-white/60 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none transition"
          />
          {!emailVerified && (
            <div className="flex flex-col md:flex-row gap-2 mt-2">
              <button onClick={sendEmailOTP} className="btn-accent px-4 py-2 text-sm hover:brightness-110 transition">
                Send OTP
              </button>
              <input
                type="text"
                placeholder="Enter OTP"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                className="border border-white/60 p-2 rounded-lg flex-1 outline-none shadow-sm"
              />
              <button onClick={verifyEmailOTP} className="btn-primary px-4 py-2 text-sm hover:brightness-110 transition">
                Verify
              </button>
            </div>
          )}
          {emailVerified && (
            <span className="text-emerald-600 font-semibold text-sm mt-2 block">✅ Email Verified</span>
          )}
        </div>

        {/* Contact Section */}
        <div className="mb-5">
          <input
            type="text"
            name="contact"
            placeholder="📱 Contact Number"
            value={form.contact}
            onChange={handleChange}
            className="w-full p-3 border border-white/60 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none transition"
          />
          {!contactVerified && (
            <div className="flex flex-col md:flex-row gap-2 mt-2">
              <button onClick={sendContactOTP} className="btn-accent px-4 py-2 text-sm hover:brightness-110 transition">
                Send OTP
              </button>
              <input
                type="text"
                placeholder="Enter OTP"
                value={contactOTP}
                onChange={(e) => setContactOTP(e.target.value)}
                className="border border-white/60 p-2 rounded-lg flex-1 outline-none shadow-sm"
              />
              <button onClick={verifyContactOTP} className="btn-primary px-4 py-2 text-sm hover:brightness-110 transition">
                Verify
              </button>
            </div>
          )}
          {contactVerified && (
            <span className="text-emerald-600 font-semibold text-sm mt-2 block">✅ Contact Verified</span>
          )}
        </div>

        <input
          type="text"
          name="altContact"
          placeholder="📞 Alternate Contact Number"
          value={form.altContact}
          onChange={handleChange}
          className="w-full p-3 mb-4 border border-white/60 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none transition"
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full p-3 mb-4 border border-white/60 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none transition"
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
          className="w-full p-3 mb-6 border border-white/60 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-200 outline-none transition"
        />

        {/* Save Button */}
        <button
          onClick={submitProfile}
          className="w-full btn-primary py-3 font-bold hover:brightness-110 transition"
        >
          🚀 Save Profile
        </button>
      </div>
    </div>
  );
}

export default ProfileForm;
