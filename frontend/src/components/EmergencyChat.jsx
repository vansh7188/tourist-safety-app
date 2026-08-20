import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEmergency } from "../context/useEmergency";
import MobileNavBar from "./MobileNavBar";

function EmergencyChat() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { socket } = useEmergency() || {};
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/emergency/${postId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load messages");
        setMessages(data.messages || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [API_BASE_URL, postId]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.emit("emergency:join", { postId });
    const handleMessage = (message) => {
      if (String(message.postId) === String(postId)) {
        setMessages((current) => [...current, message]);
      }
    };
    socket.on("chat:message", handleMessage);
    return () => socket.off("chat:message", handleMessage);
  }, [postId, socket]);

  const sendMessage = (event) => {
    event.preventDefault();
    if (!socket || !text.trim()) return;
    socket.emit("chat:message", { postId, text: text.trim() });
    setText("");
  };

  return (
    <div className="min-h-screen app-shell px-4 py-6 pb-28 md:px-8 md:pb-6">
      <div className="mx-auto flex h-[calc(100vh-3rem)] w-full max-w-3xl flex-col rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-md md:p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Emergency Helper</p>
            <h1 className="text-xl font-extrabold text-slate-900">Live support chat</h1>
          </div>
          <button type="button" onClick={() => navigate("/dashboard")} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Back</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {loading && <p className="text-sm text-slate-500">Loading conversation...</p>}
          {!loading && !messages.length && <p className="text-sm text-slate-500">No messages yet. Send a message to coordinate help.</p>}
          {messages.map((message) => (
            <div key={message._id || `${message.createdAt}-${message.text}`} className="mb-3 flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-slate-900">
                {message.senderId?.name && <p className="mb-1 text-xs font-bold text-sky-700">{message.senderId.name}</p>}
                {message.text}
              </div>
            </div>
          ))}
        </div>
        {error && <p className="mb-3 text-sm font-semibold text-rose-600">{error}</p>}
        <form onSubmit={sendMessage} className="flex gap-3 border-t border-slate-200 pt-4">
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Type a message..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
          <button type="submit" disabled={!socket || !text.trim()} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Send</button>
        </form>
      </div>
      <MobileNavBar active="emergency" onChat={() => navigate("/chatbot")} onNavigate={navigate} />
    </div>
  );
}

export default EmergencyChat;
