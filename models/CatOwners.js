
const mongoose = require("mongoose")

const CatOwnerSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  mname: { type: String },
  lname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  phone: { type: String,required: true },
  address: {
    state: String,
    city: String,
    street: String,
    pincode: String
  },
  user_type: { type: String, default: "cat_owner" }, 
  join_date: { type: Date, default: Date.now }, 
  status: { type: Boolean, default: true }
});

const CatOwnerModel = mongoose.model("CatOwners",CatOwnerSchema)
module.exports = CatOwnerModel