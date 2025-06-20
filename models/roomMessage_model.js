import mongoose from "mongoose";
const RoomMessageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: [true, "Room name is required"],
    trim: true,
  },
  from: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
export const RoomMessage = mongoose.model("RoomMessage", RoomMessageSchema);
