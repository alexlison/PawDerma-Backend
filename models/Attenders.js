const mongoose = require("mongoose")

const attenderSchema = new mongoose.Schema({
    Name : { type : String, required : true },
    email : { type : String, required : true, unique: true },
    phone : { type : String, required : true, unique: true },
    password : { type : String, required : true },
    qualification : { type : String, required : true },
    dob : { type : String, required : true },
    gender : { type : String, required : true },
    user_type: { type: String, default: "attender" }, 
    join_date: { type: Date, default: Date.now }, 
    status: { type: Boolean, default: true }
   
})

const attenderModel = mongoose.model("attenders",attenderSchema)
module.exports = attenderModel