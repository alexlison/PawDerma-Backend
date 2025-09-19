
const mongoose = require("mongoose")

const attenderScheduleSchema = new mongoose.Schema(
    {
      attenderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "attenders", 
      required: true 
      },
    date: { type: Date, required: true },
    vaccinationFrom: { type: String, required: true },
    vaccinationTo: { type: String, required: true },
    slots: { type: Number, required: true },
    remaining_slots: { type:Number  }
  }
)

const attenderSchedulesModel = mongoose.model("attenderSchedules",attenderScheduleSchema)
module.exports = attenderSchedulesModel