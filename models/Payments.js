const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  appointment_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "appointments", 
    required: true 
  },
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { 
    type: String, 
    enum: ["created", "attempted", "paid", "failed"], 
    default: "created" 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const PaymentModel = mongoose.model("payments", paymentSchema);
module.exports = PaymentModel;