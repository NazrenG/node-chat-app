import mongoose from "mongoose";

const JoinedRoomSchema = new mongoose.Schema({
  room: {
    type: String,
    required: [true, "Room name is required"],
    trim: true,
    unique: [true, "Room name must be unique"],
  },
  users: {
    type: [String],
    default: [],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
export const JoinedRoom = mongoose.model("JoinedRoom", JoinedRoomSchema);
