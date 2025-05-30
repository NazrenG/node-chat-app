import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: [true, "Username must be unique"],
  },
  password: {
    type: String,
    required: true,
    minLength: [6, "Password must be at least 6 characters long"],
  },
});
export const User = mongoose.model("User", userSchema);
