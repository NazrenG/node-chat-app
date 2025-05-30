import { registerUser } from "./controllers/auth_controller.js";
import { RoomMessage } from "./models/roomMessage_model.js";
import { PrivateMessage } from "./models/privateMessage_model.js";
import { User } from "./models/user_model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

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

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("register", async (username, password) => {
    await registerUser(username, password);
    users[socket.id] = username;
    console.log(`Registered ${username}`);
    socket.emit("register_success", `Welcome ${username}!`);
  });

  socket.on("send_private_message", ({ to, message }) => {
    const targetSocketId = Object.keys(users).find((key) => users[key] === to);
   try{
        PrivateMessage.create({
            from: users[socket.id],
            to,
            message,
        });
        } catch (error) {
      console.error("Error saving private message:", error);    
      
   }
   
    if (targetSocketId) {
      io.to(targetSocketId).emit("receive_private_message", {
        from: users[socket.id],
        message,
      });
    }
  });

  socket.on("join_room", (room) => {
    socket.join(room);
    rooms[room] = rooms[room] || [];
    rooms[room].push(socket.id);
    console.log(`${users[socket.id]} joined room ${room}`);
  });

  socket.on("send_room_message", async({ room, message }) => {
    try{
        await RoomMessage.create({
          room,
          from: users[socket.id],
          message,
        });
    }
    catch (error) {
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



server.listen(3000, () => {
  dbConnect();
  console.log("Server listening on port 3000");
});
