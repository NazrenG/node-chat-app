import { registerUser } from "./controllers/auth_controller.js";
import { RoomMessage } from "./models/roomMessage_model.js";
import { PrivateMessage } from "./models/privateMessage_model.js";
import { JoinedRoom } from "./models/joinedRoom_model.js";
import { User } from "./models/user_model.js";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const users = {};
const rooms = {};
const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};
const loadsRooms = async () => {
  const joinedRooms = await JoinedRoom.find({});
  joinedRooms.forEach((room) => {
    rooms[room.room] = room.users;
  });
  console.log("Rooms loaded successfully:", Object.keys(rooms));
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("register", async ({ username, password }) => {
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        try {
          const isMatch = await bcryptjs.compare(
            password,
            existingUser.password
          );
          if (!isMatch) {
            socket.emit("login_error", "Incorrect password");
            return;
          }

          users[socket.id] = username;
          socket.emit("login_success", `Welcome back ${username}!`);
        } catch (error) {
          console.error("Login error:", error);
          socket.emit("login_error", "Login failed due to server error");
        }
        return;
      }

      const hashedPassword = await bcryptjs.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();

      users[socket.id] = username;
      console.log(`User ${username} registered successfully`);
      socket.emit("register_success", `Welcome ${username}!`);
    } catch (error) {
      console.error("Error registering user:", error);
      socket.emit("register_error", "Registration failed due to server error");
    }
  });

  socket.on("get_private_history", async ({ from, to }) => {
    try {
      const history = await PrivateMessage.find({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(10);
      socket.emit("private_message_history", history.reverse());
    } catch (err) {
      console.error("Error fetching private message history:", err);
    }
  });

  socket.on("send_private_message", async ({ to, message }) => {
    const sender = users[socket.id];
    const targetSocketId = Object.keys(users).find((key) => users[key] === to);

    try {
      await PrivateMessage.create({
        from: sender,
        to,
        message,
      });
    } catch (error) {
      console.error("Error saving private message:", error);
    }

    if (targetSocketId) {
      io.to(targetSocketId).emit("receive_private_message", {
        from: sender,
        message,
      });
    }
  });

  socket.on("join_room", async (room) => {
    const username = users[socket.id];
    if (!username) return;

    socket.join(room);
    rooms[room] = rooms[room] || [];
    if (!rooms[room].includes(username)) {
      rooms[room].push(username);

      try {
        await JoinedRoom.updateOne(
          { room },
          { $addToSet: { users: username } },
          { upsert: true }
        );
      } catch (error) {
        console.error("Error saving joined room:", error);
      }
    }
  });
  socket.on("get_room_history", async (room) => {
    try {
      const history = await RoomMessage.find({ room })
        .sort({ timestamp: -1 })
        .limit(100);
      socket.emit("room_history", history.reverse());
    } catch (error) {
      console.error("Error fetching room history:", error);
    }
  });
  socket.on("send_room_message", async ({ room, message }) => {
    try {
      await RoomMessage.create({
        room,
        from: users[socket.id],
        message,
      });
    } catch (error) {
      console.error("Error saving room message:", error);
    }
    io.to(room).emit("receive_room_message", {
      from: users[socket.id],
      message,
    });
  });

  socket.on("disconnect", () => {
    console.log(`${users[socket.id]} disconnected`);
    delete users[socket.id];
  });
});

app.get("/users", (req, res) => {
  res.json(Object.values(users));
});

app.get("/rooms", (req, res) => {
  res.json(Object.keys(rooms));
});

server.listen(3000, async () => {
  await dbConnect();
  await loadsRooms();
  console.log("Server listening on port 3000");
});
