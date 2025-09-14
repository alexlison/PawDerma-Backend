const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "appointments",
    required: true,
    unique: true
  },
  catId: { type: mongoose.Schema.Types.ObjectId, ref: "Cats", required: true },
  catOwner_id: { type: mongoose.Schema.Types.ObjectId, ref: "CatOwners", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctors", required: true },

  bookingType: { type: String, enum: ["GENERAL", "SKIN","VACCINATION"], required: true },

  symptoms: {
    fever: { type: String, enum: ["yes", "no"], default: "no" },
    vomiting: { type: String, enum: ["yes", "no"], default: "no" },
    cough: { type: String, enum: ["yes", "no"], default: "no" },
    loss_of_appetite: { type: String, enum: ["yes", "no"], default: "no" },
    diarrhea: { type: String, enum: ["yes", "no"], default: "no" }
  },

 
  skinAnalysis: {
    diseaseImage: { type: String },
    predictedDisease: { type: String },
    confidenceScore: { type: Number }
  },

  prescription:{
    medicine :{ type: String, required: true },
    notes : {type: String, required: true },
    followUpDate: {type: Date},

  },

  createdAt: { type: Date, default: Date.now }
});

const medicalRecordModel = mongoose.model("medicalRecords", medicalRecordSchema);
module.exports = medicalRecordModel;
