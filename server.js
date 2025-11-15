import express from "express";
import { Server } from "socket.io";

const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Nodejs Socket App listening on port: ${port}...`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  return res.send("This is Digital Lost and Found Nodejs Socket Backend");
});

let onlineUsers = [];

io.on("connection", (socket) => {
  // This socket is for joining the room
  socket.on("join", (userId) => {
    if (!socket.rooms.has(userId.roomId)) {
      socket.join(userId);
      if (!onlineUsers.includes(userId)) {
        onlineUsers.push(userId);
      }
    }

    onlineUsers.forEach((user) => {
      io.to(user).emit("online-users-updated", onlineUsers);
    });
  });

  socket.on("typing", ({ chat, senderId }) => {
    chat.users.forEach((user) => {
      if (user._id !== senderId) io.to(user._id).emit("typing", chat);
    });
  });

  socket.on("send-new-message", (message) => {
    message.chat.users.forEach((user) => {
      io.to(user._id).emit("new-message-received", message);
    });
  });

  socket.on("read-all-messages", ({ chatId, users, readByUserId }) => {
    users.forEach((user) => {
      io.to(user).emit("user-read-all-chat-messages", { chatId, readByUserId });
    });
  });

  // This socket logout user from the room
  socket.on("logout", (userId) => {
    socket.leave(userId);
    onlineUsers = onlineUsers.filter((user) => user !== userId);

    onlineUsers.forEach((user) => {
      io.to(user).emit("online-users-updated", onlineUsers);
    });
  });
});
