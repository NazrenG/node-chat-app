import User from "../models/user_model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken.js";

// Register a new user
export const registerUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    const { accessToken, refreshToken } = generateToken(newUser, res);
    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);
  }
};
// User login
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
    console.log("user not found");
    await registerUser(req, res);
    console.log("user registered successfully, logging in now");
    return process.exit(0); 
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const tokenData = generateToken(user, res);
    res.status(200).json({
      message: "User logged in successfully",
      user: {
        id: user._id,
        username: user.username,
      },
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    });
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
