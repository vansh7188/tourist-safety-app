import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaSearch,
  FaCompass,
  FaCalendarAlt,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaComments,
  FaStar,
  FaShieldAlt,
  FaFilter,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaInfoCircle,
} from "react-icons/fa";
import MobileNavBar from "../components/MobileNavBar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { GuideBookingProvider, useGuideBooking } from "../context/GuideBookingContext";
import GuideCard from "../components/GuideCard";
import GuideBookingModal from "../components/GuideBookingModal";
import GuideBecomeForm from "../components/GuideBecomeForm";
import GuideReviewModal from "../components/GuideReviewModal";
import InlineGuideChat from "../components/InlineGuideChat";

export default function GuidePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <GuideBookingProvider>
      <GuideContent navigate={navigate} />
    </GuideBookingProvider>
  );
}

function GuideContent({ navigate }) {
  const { t } = useLanguage();
  const { socket, bookingNotifications, dismissNotification } = useGuideBooking();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [activeSection, setActiveSection] = useState("discover");

  // Discover state
  const [guides, setGuides] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [searchLanguage, setSearchLanguage] = useState("");
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedGuideForBooking, setSelectedGuideForBooking] = useState(null);
  const [selectedGuideDetail, setSelectedGuideDetail] = useState(null);

  // My Bookings state (as a tourist)
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeChatBookingId, setActiveChatBookingId] = useState(null);
  const [reviewBookingTarget, setReviewBookingTarget] = useState(null);

  // Guide Hub state (as a guide)
  const [myGuideProfile, setMyGuideProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [receivedBookings, setReceivedBookings] = useState([]);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeGuideChatBookingId, setActiveGuideChatBookingId] = useState(null);

  // 1. Fetch Discover Guides
  const fetchGuides = async () => {
    setLoadingGuides(true);
    try {
      const token = localStorage.getItem("token");
      const currentLocation = JSON.parse(localStorage.getItem("currentLocation") || "null");

      const params = new URLSearchParams();
      if (searchCity) params.append("city", searchCity);
      if (searchLanguage) params.append("language", searchLanguage);
      if (searchSpecialty) params.append("specialty", searchSpecialty);
      if (maxPrice) params.append("maxPrice", maxPrice);

      if (currentLocation?.lat && currentLocation?.lng) {
        params.append("lat", currentLocation.lat);
        params.append("lng", currentLocation.lng);
        params.append("radiusKm", "50");
      }

      const response = await fetch(`${API_BASE_URL}/api/guides/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setGuides(data.guides || []);
      }
    } catch (err) {
      console.error("Error fetching guides:", err);
    } finally {
      setLoadingGuides(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  // 2. Fetch My Tourist Bookings
  const fetchMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/guides/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMyBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching tourist bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (activeSection === "bookings") {
      fetchMyBookings();
    }
  }, [activeSection]);

  // 3. Fetch Guide Hub Data
  const fetchGuideHubData = async () => {
    setLoadingProfile(true);
    setLoadingReceived(true);
    const token = localStorage.getItem("token");

    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/guides/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.guide) {
        setMyGuideProfile(profileData.guide);

        // Fetch received bookings
        const bookingsRes = await fetch(`${API_BASE_URL}/api/guides/bookings/received`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const bookingsData = await bookingsRes.json();
        if (bookingsRes.ok) {
          setReceivedBookings(bookingsData.bookings || []);
        }
      } else {
        setMyGuideProfile(null);
      }
    } catch (err) {
      console.error("Error fetching guide hub:", err);
    } finally {
      setLoadingProfile(false);
      setLoadingReceived(false);
    }
  };

  useEffect(() => {
    if (activeSection === "hub") {
      fetchGuideHubData();
    }
  }, [activeSection]);

  // Status transition handlers
  const handleUpdateBookingStatus = async (bookingId, status, cancelReason = "") => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/guides/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, cancelReason }),
      });

      const data = await response.json();
      if (response.ok) {
        // Refresh appropriate lists
        fetchMyBookings();
        fetchGuideHubData();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleToggleActive = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/guides/toggle-active`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMyGuideProfile((prev) => ({ ...prev, isActive: data.isActive }));
      }
    } catch (err) {
      console.error("Error toggling active status:", err);
    }
  };

  const activeTouristChatBooking = myBookings.find((b) => b._id === activeChatBookingId);
  const activeGuideChatBooking = receivedBookings.find((b) => b._id === activeGuideChatBookingId);

  return (
    <div className="min-h-screen app-shell pb-28 text-slate-900 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#04617B] text-white shadow-sm backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-6">
          <button type="button" onClick={() => navigate("/dashboard")} className="text-left">
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-200">{t("safeTravel")}</div>
            <div className="text-xl font-bold text-white">Globe Guard</div>
            <div className="mt-1 text-xs text-teal-100/80">Local Guide Booking</div>
          </button>
          <div className="flex items-center gap-4">
            <LanguageSwitcher dark />
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="hidden rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/25 md:block"
            >
              {t("backToDashboard")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex flex-col items-center text-white"
            >
              <FaUserCircle className="text-3xl" />
              <span className="mt-1 text-xs">Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Alert Bar */}
      {bookingNotifications.length > 0 && (
        <div className="bg-teal-700 px-4 py-2 text-white shadow-inner">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <FaInfoCircle className="text-teal-300" />
              <span>{bookingNotifications[0].message}</span>
            </div>
            <button
              onClick={() => dismissNotification(bookingNotifications[0].bookingId)}
              className="rounded bg-teal-800 px-2 py-0.5 text-[10px] font-bold text-teal-200 hover:bg-teal-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-3 py-6 md:px-4 md:py-8 lg:px-6">
        {/* Page Hero Description */}
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-700">Verified Local Companions</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Local Tourist Guides</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Book verified local guides and cultural experts for authentic, safe travel experiences with flexible hourly or day packages.
          </p>
        </div>

        {/* Section Layout */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          {/* Navigation Sidebar */}
          <aside className="w-full shrink-0 lg:ml-1 lg:w-60 xl:w-64">
            <div className="section-card border border-slate-200/80 bg-white/80 p-2 shadow-sm rounded-2xl">
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Guide Portal Menu
              </p>
              <div className="flex gap-2 overflow-x-auto lg:flex-col">
                <GuideSectionButton
                  active={activeSection === "discover"}
                  tone="teal"
                  onClick={() => setActiveSection("discover")}
                  number="01"
                  label="Discover Guides"
                  icon={<FaCompass />}
                />
                <GuideSectionButton
                  active={activeSection === "bookings"}
                  tone="sky"
                  onClick={() => setActiveSection("bookings")}
                  number="02"
                  label="My Bookings"
                  icon={<FaCalendarAlt />}
                  badge={myBookings.length > 0 ? myBookings.length : null}
                />
                <GuideSectionButton
                  active={activeSection === "hub"}
                  tone="amber"
                  onClick={() => setActiveSection("hub")}
                  number="03"
                  label="Guide Hub / Join"
                  icon={<FaUserTie />}
                  badge={receivedBookings.filter((b) => b.status === "pending").length || null}
                />
              </div>
            </div>
          </aside>

          {/* Section Main Content */}
          <section className="section-card min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm md:p-6">
            {/* 1. DISCOVER GUIDES */}
            {activeSection === "discover" && (
              <div>
                <GuideSectionHeading
                  number="01"
                  title="Discover Local Guides"
                  description="Find certified & reviewed guides near your destination."
                  tone="teal"
                />

                {/* Filter & Search Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchGuides();
                  }}
                  className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm space-y-3"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search City or Area..."
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Language (e.g. English, Hindi)"
                        value={searchLanguage}
                        onChange={(e) => setSearchLanguage(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Specialty (e.g. Heritage, Food)"
                        value={searchSpecialty}
                        onChange={(e) => setSearchSpecialty(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Max Hourly Rate (₹)"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchCity("");
                        setSearchLanguage("");
                        setSearchSpecialty("");
                        setMaxPrice("");
                        setTimeout(fetchGuides, 50);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Clear Filters
                    </button>
                    <button
                      type="submit"
                      disabled={loadingGuides}
                      className="flex items-center gap-1.5 rounded-xl bg-[#04617B] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#034d62]"
                    >
                      <FaSearch /> {loadingGuides ? "Searching..." : "Search Guides"}
                    </button>
                  </div>
                </form>

                {/* Guides Grid */}
                {loadingGuides ? (
                  <div className="py-12 text-center text-sm font-semibold text-slate-400">
                    Discovering top certified local guides...
                  </div>
                ) : guides.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                    <FaCompass className="mx-auto mb-3 text-4xl text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No local guides found</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching for another city.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {guides.map((guide) => (
                      <GuideCard
                        key={guide._id}
                        guide={guide}
                        onBook={(g) => setSelectedGuideForBooking(g)}
                        onSelect={(g) => setSelectedGuideDetail(g)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. MY TOURIST BOOKINGS */}
            {activeSection === "bookings" && (
              <div>
                <GuideSectionHeading
                  number="02"
                  title="My Tour Bookings"
                  description="Review your tour requests, chat with your guides, and share feedback."
                  tone="sky"
                />

                {loadingBookings ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Loading your tour bookings...</p>
                ) : myBookings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                    <FaCalendarAlt className="mx-auto mb-3 text-4xl text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No bookings yet</p>
                    <p className="text-xs text-slate-400 mt-1">Explore guides and book your first private local tour.</p>
                    <button
                      onClick={() => setActiveSection("discover")}
                      className="mt-4 rounded-xl bg-[#04617B] px-4 py-2 text-xs font-bold text-white shadow"
                    >
                      Browse Guides
                    </button>
                  </div>
                ) : (
                  <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
                    {/* Bookings List */}
                    <div className="space-y-3">
                      {myBookings.map((b) => {
                        const isChatActive = activeChatBookingId === b._id;
                        return (
                          <article
                            key={b._id}
                            className={`rounded-2xl border p-4 transition ${
                              isChatActive
                                ? "border-teal-500 bg-teal-50/30 shadow-md"
                                : "border-slate-200/80 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                                  {b.duration === "hourly"
                                    ? `${b.hours || 1} Hour Tour`
                                    : b.duration === "halfDay"
                                    ? "Half Day (4 hrs)"
                                    : "Full Day (8 hrs)"}
                                </span>
                                <h4 className="text-base font-extrabold text-slate-900">
                                  {b.guideUserId?.name || "Local Guide"}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Date: <strong className="text-slate-700">{new Date(b.date).toLocaleDateString()}</strong>
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                                  b.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : b.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : b.status === "completed"
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>

                            {b.meetingPoint?.address && (
                              <p className="mt-2 text-xs text-slate-600">
                                <span className="font-bold">Pickup/Meeting:</span> {b.meetingPoint.address}
                              </p>
                            )}

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                              <div>
                                <span className="text-slate-400 text-[10px]">Total Price</span>
                                <div className="font-extrabold text-slate-900">₹{b.totalPrice}</div>
                              </div>

                              <div className="flex items-center gap-2">
                                {b.status !== "cancelled" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveChatBookingId(isChatActive ? null : b._id)
                                    }
                                    className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                      isChatActive
                                        ? "bg-teal-700 text-white"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                  >
                                    <FaComments /> {isChatActive ? "Close Chat" : "Live Chat"}
                                  </button>
                                )}

                                {b.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateBookingStatus(b._id, "cancelled", "Cancelled by tourist")}
                                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                                  >
                                    Cancel
                                  </button>
                                )}

                                {b.status === "completed" && (
                                  <button
                                    type="button"
                                    onClick={() => setReviewBookingTarget(b)}
                                    className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600"
                                  >
                                    <FaStar className="text-[10px]" /> Rate Guide
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {/* Chat Window Panel */}
                    <div className="sticky top-20">
                      <InlineGuideChat
                        bookingId={activeChatBookingId}
                        booking={activeTouristChatBooking}
                        socket={socket}
                        apiBaseUrl={API_BASE_URL}
                        onClose={() => setActiveChatBookingId(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. GUIDE HUB / BECOME A GUIDE */}
            {activeSection === "hub" && (
              <div>
                <GuideSectionHeading
                  number="03"
                  title="Local Guide Hub"
                  description="Earn money, host tours, and coordinate with travelers as an official guide."
                  tone="amber"
                />

                {loadingProfile ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Loading guide hub profile...</p>
                ) : !myGuideProfile ? (
                  /* Not Registered Yet */
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/50 via-white to-teal-50/40 p-6">
                    <div className="mb-6 max-w-xl">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                        Become an Official Guide
                      </span>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">
                        Share your city with travelers worldwide
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        Register your local guide profile, set your custom hourly and full-day rates, showcase your languages and tour specialties, and receive direct verified tour requests.
                      </p>
                    </div>

                    <GuideBecomeForm
                      apiBaseUrl={API_BASE_URL}
                      onSaved={(guide) => {
                        setMyGuideProfile(guide);
                        fetchGuideHubData();
                      }}
                    />
                  </div>
                ) : (
                  /* Registered Guide Dashboard */
                  <div className="space-y-6">
                    {/* Guide Status Header Card */}
                    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                              Official Guide Profile
                            </span>
                            {myGuideProfile.verified && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-600/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                                <FaShieldAlt /> Verified
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-extrabold text-white mt-1">
                            {myGuideProfile.city || "Local Guide"}
                          </h3>
                          <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{myGuideProfile.bio}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleToggleActive}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                              myGuideProfile.isActive
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            {myGuideProfile.isActive ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                            {myGuideProfile.isActive ? "Available for Tours" : "Paused / Offline"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                          >
                            {isEditingProfile ? "Close Edit" : "Edit Profile"}
                          </button>
                        </div>
                      </div>

                      {/* Mini Stats Bar */}
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/10 pt-4 text-center">
                        <div className="rounded-xl bg-white/5 p-2.5">
                          <span className="text-[10px] text-slate-400">Total Tours</span>
                          <div className="text-base font-extrabold text-white">{myGuideProfile.totalBookings || 0}</div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-2.5">
                          <span className="text-[10px] text-slate-400">Rating</span>
                          <div className="text-base font-extrabold text-amber-400 flex items-center justify-center gap-1">
                            <FaStar /> {myGuideProfile.rating?.average ? myGuideProfile.rating.average.toFixed(1) : "New"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-2.5">
                          <span className="text-[10px] text-slate-400">Hourly Rate</span>
                          <div className="text-base font-extrabold text-teal-300">₹{myGuideProfile.pricing?.hourly || 0}</div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-2.5">
                          <span className="text-[10px] text-slate-400">Full Day Rate</span>
                          <div className="text-base font-extrabold text-teal-300">₹{myGuideProfile.pricing?.fullDay || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Profile Form (collapsible) */}
                    {isEditingProfile && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                        <h4 className="text-sm font-extrabold text-slate-800 mb-4">Edit Your Guide Details</h4>
                        <GuideBecomeForm
                          existingGuide={myGuideProfile}
                          apiBaseUrl={API_BASE_URL}
                          onSaved={(updated) => {
                            setMyGuideProfile(updated);
                            setIsEditingProfile(false);
                          }}
                        />
                      </div>
                    )}

                    {/* Received Tour Bookings */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-extrabold text-slate-900">
                          Incoming Tour Requests ({receivedBookings.length})
                        </h4>
                      </div>

                      {loadingReceived ? (
                        <p className="text-xs text-slate-400 py-6 text-center">Loading tour requests...</p>
                      ) : receivedBookings.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-slate-400">
                          <FaCalendarAlt className="mx-auto mb-2 text-3xl text-slate-300" />
                          <p className="text-xs font-semibold">No tour requests received yet.</p>
                        </div>
                      ) : (
                        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
                          <div className="space-y-3">
                            {receivedBookings.map((b) => {
                              const isChatActive = activeGuideChatBookingId === b._id;
                              return (
                                <article
                                  key={b._id}
                                  className={`rounded-2xl border p-4 transition ${
                                    isChatActive
                                      ? "border-amber-500 bg-amber-50/30 shadow-md"
                                      : "border-slate-200/80 bg-white hover:border-slate-300"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                        {b.duration === "hourly"
                                          ? `${b.hours || 1} Hour Tour`
                                          : b.duration === "halfDay"
                                          ? "Half Day"
                                          : "Full Day"}
                                      </span>
                                      <h5 className="text-base font-extrabold text-slate-900">
                                        {b.touristId?.name || "Traveler"}
                                      </h5>
                                      <p className="text-xs text-slate-500">
                                        Date: <strong className="text-slate-700">{new Date(b.date).toLocaleDateString()}</strong>
                                      </p>
                                    </div>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                                        b.status === "confirmed"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : b.status === "pending"
                                          ? "bg-amber-100 text-amber-800"
                                          : b.status === "completed"
                                          ? "bg-sky-100 text-sky-800"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </div>

                                  {b.notes && (
                                    <p className="mt-2 rounded-xl bg-slate-50 p-2 text-xs text-slate-600 italic">
                                      "{b.notes}"
                                    </p>
                                  )}

                                  {b.meetingPoint?.address && (
                                    <p className="mt-2 text-xs text-slate-600">
                                      <span className="font-bold">Pickup/Meeting:</span> {b.meetingPoint.address}
                                    </p>
                                  )}

                                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                                    <div>
                                      <span className="text-slate-400 text-[10px]">Earnings</span>
                                      <div className="font-extrabold text-slate-900">₹{b.totalPrice}</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveGuideChatBookingId(isChatActive ? null : b._id)
                                        }
                                        className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                          isChatActive
                                            ? "bg-amber-600 text-white"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                      >
                                        <FaComments /> {isChatActive ? "Close Chat" : "Chat"}
                                      </button>

                                      {b.status === "pending" && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateBookingStatus(b._id, "confirmed")}
                                            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                                          >
                                            <FaCheckCircle className="text-[10px]" /> Accept
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleUpdateBookingStatus(
                                                b._id,
                                                "cancelled",
                                                "Guide unavailable on this date"
                                              )
                                            }
                                            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                                          >
                                            <FaTimesCircle className="text-[10px]" /> Decline
                                          </button>
                                        </>
                                      )}

                                      {b.status === "confirmed" && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateBookingStatus(b._id, "completed")}
                                          className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                                        >
                                          Mark Tour Completed
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>

                          {/* Chat Window Panel */}
                          <div className="sticky top-20">
                            <InlineGuideChat
                              bookingId={activeGuideChatBookingId}
                              booking={activeGuideChatBooking}
                              socket={socket}
                              apiBaseUrl={API_BASE_URL}
                              onClose={() => setActiveGuideChatBookingId(null)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Booking Modal */}
      {selectedGuideForBooking && (
        <GuideBookingModal
          guide={selectedGuideForBooking}
          apiBaseUrl={API_BASE_URL}
          onClose={() => setSelectedGuideForBooking(null)}
          onBooked={(booking) => {
            setSelectedGuideForBooking(null);
            setActiveSection("bookings");
            fetchMyBookings();
          }}
        />
      )}

      {/* Guide Details Modal */}
      {selectedGuideDetail && (
        <GuideDetailModal
          guide={selectedGuideDetail}
          onClose={() => setSelectedGuideDetail(null)}
          onBook={(g) => {
            setSelectedGuideDetail(null);
            setSelectedGuideForBooking(g);
          }}
        />
      )}

      {/* Review Modal */}
      {reviewBookingTarget && (
        <GuideReviewModal
          booking={reviewBookingTarget}
          apiBaseUrl={API_BASE_URL}
          onClose={() => setReviewBookingTarget(null)}
          onReviewed={() => {
            setReviewBookingTarget(null);
            fetchMyBookings();
          }}
        />
      )}

      {/* Mobile Nav Bar */}
      <MobileNavBar active="guides" onChat={() => navigate("/chatbot")} onNavigate={navigate} />
    </div>
  );
}

function GuideSectionButton({ active, tone, onClick, number, label, icon, badge }) {
  const styles = {
    teal: active
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : "border-transparent text-slate-500 hover:bg-teal-50/60",
    sky: active
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : "border-transparent text-slate-500 hover:bg-sky-50/60",
    amber: active
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-transparent text-slate-500 hover:bg-amber-50/60",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-max items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition lg:w-full ${styles[tone]}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-extrabold opacity-70">{number}</span>
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function GuideSectionHeading({ number, title, description, tone }) {
  const numberStyles = {
    teal: "bg-teal-100 text-teal-700",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${numberStyles[tone]}`}
        >
          {number}
        </span>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      </div>
      <p className="ml-11 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function GuideDetailModal({ guide, onClose, onBook }) {
  if (!guide) return null;
  const guideName = guide.userId?.name || "Local Guide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
        >
          &times;
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Guide Profile</span>
          <h2 className="text-2xl font-black text-slate-900">{guideName}</h2>
          {guide.city && <p className="text-xs text-slate-500">{guide.city}</p>}
        </div>

        {guide.coverPhoto && (
          <img
            src={guide.coverPhoto}
            alt={guideName}
            className="mb-4 h-48 w-full rounded-xl object-cover"
          />
        )}

        <div className="space-y-4 text-xs text-slate-700">
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] mb-1">About Guide</h4>
            <p className="leading-relaxed whitespace-pre-wrap">{guide.bio || "No biography provided."}</p>
          </div>

          {guide.languages?.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] mb-1">Languages</h4>
              <div className="flex flex-wrap gap-1.5">
                {guide.languages.map((l, i) => (
                  <span key={i} className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {guide.specialties?.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] mb-1">Tour Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {guide.specialties.map((s, i) => (
                  <span key={i} className="rounded-lg bg-teal-50 px-2 py-1 font-semibold text-teal-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[10px] mb-2">Pricing Packages</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500">Hourly</span>
                <div className="font-extrabold text-slate-900 text-sm">₹{guide.pricing?.hourly || 0}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Half Day (4h)</span>
                <div className="font-extrabold text-slate-900 text-sm">₹{guide.pricing?.halfDay || 0}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Full Day (8h)</span>
                <div className="font-extrabold text-slate-900 text-sm">₹{guide.pricing?.fullDay || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onBook(guide)}
            className="flex-1 rounded-xl bg-[#04617B] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#034d62]"
          >
            Book This Guide
          </button>
        </div>
      </div>
    </div>
  );
}
