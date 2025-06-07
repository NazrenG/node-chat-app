import { User } from "../models/user_model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken.js";

import { Server } from "socket.io";

// Register a new user
export const registerUser = async ({ username, password }) => {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    socke;
    console.log("User registered successfully,logging in now");
    return false;
    //  return loginUser(username, password);
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    console.log("User registered successfully");
    return true;
  } catch (error) {
    console.error("Error registering user:", error);
  }
};

// User login
export const loginUser = async (username, password) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found");
      await registerUser({ username, password });
      console.log("User registered successfully, logging in now");
      return;
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      console.error("Invalid password");
      return;
    }

    console.log("User logged in successfully");
  } catch (error) {
    console.error("Error logging in user:", error);
  }
};

// Refresh access token
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const newTokenData = generateToken(user, res);
    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken: newTokenData.accessToken,
      refreshToken: newTokenData.refreshToken,
    });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Logout user
export const logoutUser = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "User logged out successfully" });
};
//check if user registered
export const isUserRegistered = async (username) => {
  try {
    const user = await User.find({ username });
    if (user.length > 0) {
      console.log("User is registered");
      return true;
    } else {
      console.log("User is not registered");
      return false;
    }
  } catch (error) {
    console.error("Error checking user registration:", error);
    return false;
  }
};
