const mongoose = require("mongoose");

const catSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  gender: { type: String, required: true },
  dob:    { type: Date, required: true },
  image:  { type: String, required: true },
  breed:  { type: String, required: true },
  color:  { type: String, required: true },

  catOwner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CatOwners",   
    required: true
  }
});

const CatModel = mongoose.model("Cats", catSchema);
module.exports = CatModel;
