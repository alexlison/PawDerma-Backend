const mongoose = require("mongoose")

const appointmentSchema = new mongoose.Schema({
  catOwner_id: { type: mongoose.Schema.Types.ObjectId, ref: "CatOwners", required: true },
  catId: { type: mongoose.Schema.Types.ObjectId, ref: "Cats", required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "doctorSchedules", required: true }, 
  token: { type: Number },
  bookingType: {
  type: String,
  enum: ["GENERAL", "SKIN", "VACCINATION"],
  required: true
  },
  symptoms: {
    fever: { type: String, enum: ["yes", "no"], default: "no" },
    vomiting: { type: String, enum: ["yes", "no"], default: "no" },
    cough: { type: String, enum: ["yes", "no"], default: "no" },
    loss_of_appetite: { type: String, enum: ["yes", "no"], default: "no" },
    diarrhea: { type: String, enum: ["yes", "no"], default: "no" }
  },
  appointmentDate: { type: Date },
  status: { type: String, enum: ["PENDING", "CONFIRMED", "COMPLETED"],default:"PENDING" }
});

const appointmentModel = mongoose.model("appointments", appointmentSchema);
module.exports = appointmentModel
