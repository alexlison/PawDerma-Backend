
const mongoose = require("mongoose")

const doctorSchema = new mongoose.Schema({
    fname : { type : String, required : true },
    mname : { type : String },
    lname : { type : String, required : true },
    email : { type : String, required : true, unique: true },
    phone : { type : String, required : true, unique: true },
    password : { type : String, required : true },
    qualification : { type : String, required : true },
    specialization : { type : String, required : true },
    dob : { type : String, required : true },
    gender : { type : String, required : true },
    experience : { type : String, required : true },
    user_type: { type: String, default: "doctor" }, 
    join_date: { type: Date, default: Date.now }, 
    status: { type: Boolean, default: true }
})

const doctorModel = mongoose.model("doctors",doctorSchema)
module.exports = doctorModel


