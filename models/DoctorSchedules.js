
const mongoose = require("mongoose")

const doctorScheduleSchema = new mongoose.Schema(
    {
      doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Doctor", 
      required: true 
      },
    date: { type: Date, required: true },
    consultationFrom: { type: String, required: true },
    consultationTo: { type: String, required: true },
    slots: { type: String, required: true },
    remaining_slots: { type: String }
  }
)

const doctorSchedulesModel = mongoose.model("doctorSchedules",doctorScheduleSchema)
module.exports = doctorSchedulesModel