
const mongoose = require("mongoose")

const doctorScheduleSchema = new mongoose.Schema(
    {
      doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "doctors", 
      required: true 
      },
    date: { type: Date, required: true },
    consultationFrom: { type: String, required: true },
    consultationTo: { type: String, required: true },
    slots: { type: Number, required: true },
    remaining_slots: { type:Number  }
  }
)

const doctorSchedulesModel = mongoose.model("doctorSchedules",doctorScheduleSchema)
module.exports = doctorSchedulesModel