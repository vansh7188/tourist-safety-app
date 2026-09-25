import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const GuideBookingContext = createContext(null);

export function GuideBookingProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [bookingNotifications, setBookingNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
    const newSocket = io(`${socketUrl}/guide-booking`, {
      auth: { token: `Bearer ${token}` },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to Guide Booking socket namespace");
    });

    newSocket.on("guide:newBooking", (notification) => {
      setBookingNotifications((prev) => [notification, ...prev]);
    });

    newSocket.on("guide:bookingConfirmed", (notification) => {
      setBookingNotifications((prev) => [notification, ...prev]);
    });

    newSocket.on("guide:bookingCancelled", (notification) => {
      setBookingNotifications((prev) => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const dismissNotification = (id) => {
    setBookingNotifications((prev) => prev.filter((n) => n.bookingId !== id));
  };

  return (
    <GuideBookingContext.Provider
      value={{
        socket,
        activeBookingId,
        setActiveBookingId,
        bookingNotifications,
        dismissNotification,
      }}
    >
      {children}
    </GuideBookingContext.Provider>
  );
}

export function useGuideBooking() {
  const context = useContext(GuideBookingContext);
  return context || {};
}
