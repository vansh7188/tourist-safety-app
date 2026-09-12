import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { EmergencyContext } from "./EmergencyContextValue";

export function EmergencyProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    fetch(`${API_BASE_URL}/api/emergency/received`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : { posts: [] }))
      .then(({ posts = [] }) => {
        setAlerts(posts.map((post) => ({
          postId: post._id,
          userId: post.userId?._id || post.userId,
          requesterName: post.userId?.name || "A traveler",
          textSnippet: post.text,
          mediaThumbnail: post.mediaUrls?.[0] || null,
          distanceMeters: null,
          acceptedByMe: Boolean(post.acceptedByMe),
          isRepeatRequester: Boolean(post.isRepeatRequester),
          requesterRequestCount: post.requesterRequestCount || 1,
          hasPreviousAccepted: Boolean(post.hasPreviousAccepted),
          location: post.location || null,
        })));
      })
      .catch(() => setAlerts([]))
      .finally(() => setReceivedLoading(false));

    const connection = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    connection.on("connect", () => {
      connection.emit("presence:register");
    });
    connection.on("emergency:new", (alert) => {
      setAlerts((current) => {
        // Check if there are already other alerts from this same userId
        const countFromSameUser = current.filter(
          (item) => item.userId && alert.userId && String(item.userId) === String(alert.userId)
        ).length;

        const enrichedAlert = {
          ...alert,
          isRepeatRequester: alert.isRepeatRequester || countFromSameUser > 0,
          requesterRequestCount: Math.max(alert.requesterRequestCount || 1, countFromSameUser + 1),
          hasPreviousAccepted: alert.hasPreviousAccepted || false,
        };

        return [
          enrichedAlert,
          ...current.filter((item) => item.postId !== alert.postId),
        ];
      });
    });
    connection.on("emergency:resolved", ({ postId }) => {
      setAlerts((current) => current.filter((item) => item.postId !== postId));
    });

    setSocket(connection);
    return () => connection.disconnect();
  }, [API_BASE_URL]);

  const dismissAlert = (postId) => {
    setAlerts((current) => current.filter((alert) => alert.postId !== postId));
  };

  return (
    <EmergencyContext.Provider value={{ socket, alerts, dismissAlert, receivedLoading }}>
      {children}
    </EmergencyContext.Provider>
  );
}

