import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import MobileNavBar from "../components/MobileNavBar";
import EmergencyHelperForm from "../components/EmergencyHelperForm";
import IncomingEmergencyAlert from "../components/IncomingEmergencyAlert";
import { EmergencyProvider } from "../context/EmergencyContext";
import { useEmergency } from "../context/useEmergency";

function EmergencyPage() {
  const navigate = useNavigate();
  const [currentLocation] = useState(
    () => JSON.parse(localStorage.getItem("currentLocation")) || null
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  return (
    <EmergencyProvider>
      <EmergencyContent currentLocation={currentLocation} navigate={navigate} />
    </EmergencyProvider>
  );
}

function EmergencyContent({ currentLocation, navigate }) {
  const { receivedLoading, socket } = useEmergency() || {};
  const [activeSection, setActiveSection] = useState("post");
  const [sentPosts, setSentPosts] = useState([]);
  const [sentLoading, setSentLoading] = useState(true);
  const [activeChatPostId, setActiveChatPostId] = useState(null);
  const [receivedAcceptedPosts, setReceivedAcceptedPosts] = useState([]);
  const [activeReceivedChatPostId, setActiveReceivedChatPostId] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/api/emergency/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : { posts: [] }))
      .then(({ posts = [] }) => setSentPosts(posts))
      .catch(() => setSentPosts([]))
      .finally(() => setSentLoading(false));
  }, [API_BASE_URL]);

  const addSentPost = (post) => {
    if (post) setSentPosts((current) => [post, ...current.filter((item) => item._id !== post._id)]);
  };

  useEffect(() => {
    if (activeSection !== "sent" && activeSection !== "received") {
      setActiveChatPostId(null);
      setActiveReceivedChatPostId(null);
    }
  }, [activeSection]);

  const activeChatPost = sentPosts.find((post) => post._id === activeChatPostId) || null;
  const activeReceivedChatPost = receivedAcceptedPosts.find((post) => post.postId === activeReceivedChatPostId) || null;

  const upsertAcceptedReceivedPost = (post) => {
    if (!post?.postId) return;
    setReceivedAcceptedPosts((current) => {
      const existing = current.find((item) => item.postId === post.postId);
      if (!existing) return [post, ...current];
      return current.map((item) => (item.postId === post.postId ? { ...item, ...post } : item));
    });
  };

  return (
      <div className="min-h-screen app-shell pb-28 text-slate-900 md:pb-6">
        <header className="sticky top-0 z-50 border-b border-white/15 bg-[#04617B] text-white shadow-sm backdrop-blur-md">
          <div className="flex w-full items-center justify-between px-4 py-3 md:px-6">
            <button type="button" onClick={() => navigate("/dashboard")} className="text-left">
              <div className="text-xs font-semibold uppercase tracking-widest text-teal-200">Safe Travel</div>
              <div className="text-xl font-bold text-white">Globe Guard</div>
              <div className="mt-1 text-xs text-teal-100/80">Emergency Helper</div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="hidden rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/25 md:block"
              >
                Back to Dashboard
              </button>
              <button type="button" onClick={() => navigate("/profile")} className="flex flex-col items-center text-white">
                <FaUserCircle className="text-3xl" />
                <span className="mt-1 text-xs">Profile</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-350 px-3 py-6 md:px-4 md:py-8 lg:px-5">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-600">Community response</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Emergency Helper</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Send your location and request to nearby people who are online and ready to help.
            </p>
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
            <aside className="w-full shrink-0 lg:ml-1 lg:w-60 xl:w-64">
              <div className="section-card border border-slate-200/80 bg-white/80 p-2 shadow-sm">
                <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Emergency menu</p>
                <div className="flex gap-2 overflow-x-auto lg:flex-col">
                  <SectionButton active={activeSection === "post"} tone="rose" onClick={() => setActiveSection("post")} number="01" label="Post emergency" />
                  <SectionButton active={activeSection === "sent"} tone="sky" onClick={() => setActiveSection("sent")} number="02" label="Sent by me" />
                  <SectionButton active={activeSection === "received"} tone="amber" onClick={() => setActiveSection("received")} number="03" label="Received nearby" />
                </div>
              </div>
            </aside>

            <section className={`section-card min-w-0 flex-1 p-5 shadow-sm md:p-6 ${activeSection === "post" ? "border border-rose-200/80 bg-white/85" : activeSection === "sent" ? "border border-slate-200/80 bg-white/85" : "border border-amber-200/80 bg-amber-50/50"}`}>
              {activeSection === "post" && (
                <>
                  <SectionHeading number="01" title="Post an emergency" description="Tell nearby helpers what is happening and share your live location." tone="rose" />
                  <EmergencyHelperForm currentLocation={currentLocation} onPosted={addSentPost} />
                </>
              )}
              {activeSection === "sent" && (
                <>
                  <SectionHeading number="02" title="Sent by me" description="Track the requests you have raised." tone="sky" />
                  {sentLoading ? (
                    <p className="text-sm text-slate-500">Loading your requests...</p>
                  ) : (
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                      <SentRequests posts={sentPosts} onOpenChat={setActiveChatPostId} />
                      <InlineEmergencyChat
                        postId={activeChatPostId}
                        post={activeChatPost}
                        socket={socket}
                        apiBaseUrl={API_BASE_URL}
                      />
                    </div>
                  )}
                </>
              )}
              {activeSection === "received" && (
                <>
                  <SectionHeading number="03" title="Received nearby" description="Open requests from travelers near your current location." tone="amber" />
                  {receivedLoading ? (
                    <p className="text-sm text-slate-500">Checking nearby requests...</p>
                  ) : (
                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
                      <IncomingEmergencyAlert
                        inline
                        currentLocation={currentLocation}
                        onAccepted={(post) => {
                          upsertAcceptedReceivedPost(post);
                          setActiveReceivedChatPostId(post.postId);
                        }}
                        onOpenChat={setActiveReceivedChatPostId}
                      />
                      <InlineEmergencyChat
                        postId={activeReceivedChatPostId}
                        post={activeReceivedChatPost}
                        socket={socket}
                        apiBaseUrl={API_BASE_URL}
                        emptyStateText="Accept a nearby request and tap Open chat to start helping."
                      />
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>

        <MobileNavBar active="emergency" onChat={() => navigate("/chatbot")} onNavigate={navigate} />
      </div>
  );
}

function SectionButton({ active, tone, onClick, number, label }) {
  const styles = {
    rose: active ? "border-rose-200 bg-rose-50 text-rose-800" : "border-transparent text-slate-500 hover:bg-rose-50/60",
    sky: active ? "border-sky-200 bg-sky-50 text-sky-800" : "border-transparent text-slate-500 hover:bg-sky-50/60",
    amber: active ? "border-amber-200 bg-amber-50 text-amber-800" : "border-transparent text-slate-500 hover:bg-amber-50/60",
  };

  return (
    <button type="button" onClick={onClick} className={`flex min-w-max items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition lg:w-full ${styles[tone]}`}>
      <span className="text-[10px] font-extrabold opacity-70">{number}</span>
      <span>{label}</span>
    </button>
  );
}

function SectionHeading({ number, title, description, tone }) {
  const numberStyles = {
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${numberStyles[tone]}`}>{number}</span>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      </div>
      <p className="ml-11 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SentRequests({ posts, onOpenChat }) {
  const [openHelpersFor, setOpenHelpersFor] = useState(null);

  if (!posts.length) return <p className="text-sm text-slate-500">No emergency requests sent yet.</p>;

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post._id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 text-sm font-semibold text-slate-800">{post.text || "Media emergency request"}</p>
            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${post.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{post.status}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{new Date(post.createdAt).toLocaleString()}</span>
            <span>{post.respondersAccepted?.length || 0} helper(s) accepted</span>
          </div>
          <button
            type="button"
            onClick={() => setOpenHelpersFor((current) => current === post._id ? null : post._id)}
            className="mt-3 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
          >
            {openHelpersFor === post._id ? "Hide helpers" : `Open helper list (${post.respondersAccepted?.length || 0})`}
          </button>
          {openHelpersFor === post._id && (
            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
              {post.respondersAccepted?.length ? post.respondersAccepted.map((helper) => (
                <div key={helper._id || helper} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{helper.name || "Accepted helper"}</p>
                    {helper.email && <p className="truncate text-[11px] text-slate-500">{helper.email}</p>}
                  </div>
                  {post.status === "open" && (
                    <button
                      type="button"
                      onClick={() => onOpenChat(post._id)}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                    >
                      Open chat
                    </button>
                  )}
                </div>
              )) : <p className="text-xs text-slate-500">No helpers have accepted this request yet.</p>}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function InlineEmergencyChat({ postId, post, socket, apiBaseUrl, emptyStateText = "Select a helper and click Open chat to start conversation." }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUserEmail = (localStorage.getItem("email") || "").trim().toLowerCase();

  const isMyMessage = (message) => {
    const sender = message?.senderId;
    if (!sender || typeof sender !== "object") return false;
    return String(sender.email || "").trim().toLowerCase() === currentUserEmail;
  };

  useEffect(() => {
    if (!postId) {
      setMessages([]);
      setText("");
      setError("");
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiBaseUrl}/api/emergency/${postId}/messages`, {
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
  }, [apiBaseUrl, postId]);

  useEffect(() => {
    if (!postId || !socket) return undefined;

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
    if (!postId || !socket || !text.trim()) return;
    socket.emit("chat:message", { postId, text: text.trim() });
    setText("");
  };

  if (!postId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/75 p-4 text-sm text-slate-500 lg:sticky lg:top-24">
        {emptyStateText}
      </div>
    );
  }

  return (
    <div className="flex h-112 flex-col rounded-xl border border-slate-200 bg-white/90 lg:sticky lg:top-24">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Live conversation</p>
        <h3 className="text-sm font-extrabold text-slate-900">{post?.text || "Emergency request"}</h3>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {loading && <p className="text-sm text-slate-500">Loading conversation...</p>}
        {!loading && !messages.length && <p className="text-sm text-slate-500">No messages yet.</p>}
        {messages.map((message) => {
          const mine = isMyMessage(message);
          return (
            <div key={message._id || `${message.createdAt}-${message.text}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${mine ? "rounded-br-sm bg-emerald-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-900"}`}>
                {!mine && message.senderId?.name && <p className="mb-1 text-[11px] font-bold text-slate-600">{message.senderId.name}</p>}
                <p>{message.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="px-4 pb-1 text-xs font-semibold text-rose-600">{error}</p>}

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button
          type="submit"
          disabled={!socket || !text.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default EmergencyPage;
