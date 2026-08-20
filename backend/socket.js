import jwt from "jsonwebtoken";
import { Server } from "socket.io";

export function createSocketServer({ server, jwtSecret, Profile, EmergencyPost, Message }) {
  const io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  const userSockets = new Map();

  const getToken = (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) return null;
    return token.startsWith("Bearer ") ? token.slice(7) : token;
  };

  const getUserSockets = (userId) => userSockets.get(String(userId)) || new Set();

  const setPresence = async (profileId, isOnline) => {
    await Profile.findByIdAndUpdate(profileId, {
      isOnline,
      lastActiveAt: new Date(),
    });
  };

  const addSocket = (profileId, socketId) => {
    const sockets = getUserSockets(profileId);
    sockets.add(socketId);
    userSockets.set(String(profileId), sockets);
  };

  const removeSocket = (profileId, socketId) => {
    const sockets = getUserSockets(profileId);
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(String(profileId));
      return false;
    }
    return true;
  };

  const emitToUser = (profileId, event, payload) => {
    for (const socketId of getUserSockets(profileId)) {
      io.to(socketId).emit(event, payload);
    }
  };

  const joinUserToRoom = (profileId, roomId) => {
    for (const socketId of getUserSockets(profileId)) {
      io.sockets.sockets.get(socketId)?.join(roomId);
    }
  };

  io.use(async (socket, next) => {
    try {
      const token = getToken(socket);
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, jwtSecret);
      const profile = await Profile.findOne({ email: decoded.email });
      if (!profile) return next(new Error("Profile not found"));

      socket.profile = profile;
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const profileId = socket.profile._id;
    addSocket(profileId, socket.id);
    await setPresence(profileId, true);

    socket.on("presence:register", (payload = {}) => {
      if (payload.userId && String(payload.userId) !== String(profileId)) {
        socket.emit("presence:error", { error: "User identity mismatch" });
      }
    });

    socket.on("emergency:join", async ({ postId } = {}) => {
      try {
        const post = await EmergencyPost.findById(postId);
        if (!post) return socket.emit("emergency:error", { error: "Emergency not found" });

        const isRequester = post.userId.equals(profileId);
        const isAcceptedResponder = post.respondersAccepted.some((id) => id.equals(profileId));
        if (!isRequester && !isAcceptedResponder) {
          return socket.emit("emergency:error", { error: "You are not a participant" });
        }

        socket.join(`emergency:${postId}`);
      } catch (error) {
        socket.emit("emergency:error", { error: "Failed to join emergency" });
      }
    });

    socket.on("chat:message", async ({ postId, text } = {}) => {
      const messageText = typeof text === "string" ? text.trim() : "";
      if (!postId || !messageText) {
        return socket.emit("chat:error", { error: "postId and text are required" });
      }

      try {
        const post = await EmergencyPost.findById(postId);
        if (!post) return socket.emit("chat:error", { error: "Emergency not found" });

        const isRequester = post.userId.equals(profileId);
        const isAcceptedResponder = post.respondersAccepted.some((id) => id.equals(profileId));
        if (!isRequester && !isAcceptedResponder) {
          return socket.emit("chat:error", { error: "You are not a participant" });
        }

        const message = await Message.create({
          postId,
          senderId: profileId,
          text: messageText,
        });

        io.to(`emergency:${postId}`).emit("chat:message", message);
      } catch (error) {
        socket.emit("chat:error", { error: "Failed to send message" });
      }
    });

    socket.on("disconnect", async () => {
      const hasOtherSockets = removeSocket(profileId, socket.id);
      if (!hasOtherSockets) await setPresence(profileId, false);
    });
  });

  return { io, emitToUser, joinUserToRoom };
}
