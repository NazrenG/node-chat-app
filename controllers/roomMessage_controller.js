import { RoomMessage } from "../models/roomMessage_model";

//get all rooms
export const getAllRooms = async () => {
  try {
    const rooms = await RoomMessage.find().populate("messages");
    return rooms;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};
