import React, { useEffect, useState, useRef } from "react";
import { FaPaperPlane, FaComments, FaTimes } from "react-icons/fa";

export default function InlineGuideChat({ bookingId, booking, socket, apiBaseUrl, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const currentUserEmail = (localStorage.getItem("email") || "").trim().toLowerCase();

  const isMyMessage = (message) => {
    const sender = message?.senderId;
    if (!sender || typeof sender !== "object") return false;
    return String(sender.email || "").trim().toLowerCase() === currentUserEmail;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch initial message history
  useEffect(() => {
    if (!bookingId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiBaseUrl}/api/guides/bookings/${bookingId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load messages");
        if (isMounted) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load messages");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [bookingId, apiBaseUrl]);

  // 2. Join Socket room and listen for real-time messages
  useEffect(() => {
    if (!socket || !bookingId) return undefined;

    socket.emit("guide:join", { bookingId });

    const handleMessage = (message) => {
      if (String(message.bookingId) === String(bookingId)) {
        setMessages((current) => {
          if (current.some((m) => m._id && message._id && String(m._id) === String(message._id))) {
            return current;
          }
          return [...current, message];
        });
      }
    };

    socket.on("guide:message", handleMessage);

    return () => {
      socket.off("guide:message", handleMessage);
    };
  }, [bookingId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (socket && socket.connected) {
      socket.emit("guide:message", { bookingId, text: text.trim() });
    } else {
      // Fallback: socket not connected
      setError("Chat connection offline. Reconnecting...");
    }
    setText("");
  };

  if (!bookingId) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-slate-400">
        <FaComments className="text-4xl mb-3 text-slate-300" />
        <p className="text-sm font-semibold">Select a booking to open live tour coordination chat.</p>
      </div>
    );
  }

  const guideName = booking?.guideUserId?.name || "Tour Guide";
  const touristName = booking?.touristId?.name || "Tourist";

  return (
    <div className="flex h-[480px] flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-[#04617B] px-4 py-3 text-white">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-teal-200">Tour Coordination Chat</div>
          <h3 className="text-sm font-extrabold truncate">
            {booking?.date ? new Date(booking.date).toLocaleDateString() : "Tour Date"} &bull; {guideName} & {touristName}
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {loading && <p className="text-xs text-slate-400 text-center py-4">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <FaComments className="mx-auto text-3xl mb-2 text-slate-300" />
            <p className="text-xs">No messages yet. Say hello and coordinate meetup details!</p>
          </div>
        )}

        {messages.map((msg) => {
          const mine = isMyMessage(msg);
          return (
            <div key={msg._id || `${msg.createdAt}-${msg.text}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                  mine
                    ? "rounded-br-sm bg-[#04617B] text-white"
                    : "rounded-bl-sm bg-white border border-slate-200/80 text-slate-800"
                }`}
              >
                {!mine && msg.senderId?.name && (
                  <p className="mb-0.5 text-[10px] font-bold text-teal-700">{msg.senderId.name}</p>
                )}
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div
                  className={`mt-1 text-[9px] text-right ${
                    mine ? "text-teal-200/80" : "text-slate-400"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="bg-rose-50 px-3 py-1.5 text-center text-xs font-semibold text-rose-600">{error}</div>}

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-slate-100 bg-white p-2.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message to coordinate..."
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#04617B] text-white transition hover:bg-[#034d62] disabled:opacity-40"
        >
          <FaPaperPlane className="text-xs" />
        </button>
      </form>
    </div>
  );
}
