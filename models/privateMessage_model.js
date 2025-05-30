import mongoose from 'mongoose';
const privateMessageSchema = new mongoose.Schema({
 from:{
    type:String,
    required: true,
 },to:{
    type:String,
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

export const PrivateMessage = mongoose.model('PrivateMessage', privateMessageSchema);