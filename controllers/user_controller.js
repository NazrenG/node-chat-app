import { User } from "../models/user_model.js";

//get all users
export const getAllUsers = async () => {
  try {
    const users = await User.find({});
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
};
