
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const CatOwnerModel = require("./models/catOwners")

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

mongoose.connect("mongodb+srv://alexlison:alexlison6885@cluster0.bz3d6.mongodb.net/PawDermaDb?retryWrites=true&w=majority&appName=Cluster0")


app.post("/signup", async (req, res) => {
    try {
        let inputData = req.body;
        
        inputData.email = inputData.email.trim().toLowerCase();
        
        inputData.password = bcrypt.hashSync(inputData.password, 10);

        inputData.address = {
            state: inputData.state,
            city: inputData.city,
            street: inputData.street,
            pincode: inputData.pincode
        };

        const emailExists = await CatOwnerModel.findOne({
            email: { $regex: new RegExp(`^${inputData.email}$`, 'i') }
        });
        
        if (emailExists) {
            return res.json({ "Status": "EmailExists" });
        }

        const phoneExists = await CatOwnerModel.findOne({ 
            phone: inputData.phone 
        });
        
        if (phoneExists) {
            return res.json({ "Status": "PhoneExists" });
        }

        const newUser = new CatOwnerModel(inputData);
        await newUser.save();
        
        return res.json({ "Status": "Success" });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ "Status": "Error" });
    }
});


app.post("/signin", async (req, res) => {
  let input = req.body;
  let userType = null;
  let user = null; 
  
  if (input.email === "admin@gmail.com" && input.password === "admin@11") {
    const payload = { userId: "admin_id", userType: "admin" };
    const token = jwt.sign(payload, "PawDermaKEY", { expiresIn: "1d" });
    
    return res.json({
      Status: "success",
      token,
      userType: "admin",
      userId: "admin_id",
      name: "Admin"
    });
  }

  let catOwner = await CatOwnerModel.findOne({ email: input.email });
  if (catOwner) {
    userType = "cat_owner";
    user = catOwner;
  } else {
    let doctor = await doctorModel.findOne({ email: input.email });
    if (doctor) {
      userType = "doctor";
      user = doctor;
    } else {

        let attender = await attenderModel.findOne({ email: input.email });
      if (attender) {
        userType = "attender";
        user = attender;
      }
    }
  }

  if (!user) {
    return res.json({ Status: "InvalidEmail" });
  }

  let passwordValidator = bcrypt.compareSync(input.password, user.password);

  if (!passwordValidator) {
    return res.json({ Status: "Incorrectpassword" });
  }

  const payload = { userId: user._id, userType };
  jwt.sign(payload, "PawDermaKEY", { expiresIn: "1d" }, (error, token) => {
    if (error) {
      return res.json({ Status: "error", errorMsg: error });
    }
    res.json({
      Status: "success",
      token,
      userId: user._id,
      userType
    });
  });
});


app.post("/doctorSignUp", async (req,res) => {

  try{

      let inputData = req.body

  inputData.email = inputData.email.trim().toLowerCase()
  
  inputData.password = bcrypt.hashSync(inputData.password,10)

  const emailExists = await doctorModel.findOne({email:{ $regex : new RegExp(`^${inputData.email}$`,'i') }})

  if(emailExists)
  {
    return res.json({"Status":"EmailExists"})
  }

  const phoneExists = await doctorModel.findOne({phone:inputData.phone})

  if(phoneExists)
  {
    return res.json({"Status":"PhoneExists"})

  }

  const newDoctor = new doctorModel(inputData)
  await newDoctor.save()

  res.json({"Status":"Success"})


  }catch(error){

    console.log(error)

  }
})


app.post("/attenderSignup",async (req,res) => {

  try{

      const inputData = req.body

        inputData.email = inputData.email.trim().toLowerCase()

        inputData.password = bcrypt.hashSync(inputData.email,10)

        const emailExists = await attenderModel.findOne({email:inputData.email})

        const phoneExists = await attenderModel.findOne({phone:inputData.phone})

        if(emailExists)
        {
         return res.json({"Status":"EmailExists"})
        }

        if(phoneExists)
        {
         return res.json({"Status":"PhoneExists"})

        } 

        const newAttender = new attenderModel(inputData)
        await newAttender.save()

        res.json({"Status":"Success"})

   }catch(error){

    console.log(error)
    

   }

})


app.post("/viewCatOwners",async (req,res) => {

  let token = req.headers.token

  jwt.verify(token,"PawDermaKEY", async (error,decoded) => {

    if (decoded && decoded.userType === "admin") {

      try{

        let catOwnersData =await CatOwnerModel.find()
        res.json(catOwnersData);

      }catch(err){

        console.log("Error Fetching Cat Owners Data",err);
        res.json({"Status":"Error"})

      }
      
    } else {

      res.json({"Status":"Invalid Authentication"})
      
    }
  });

});

app.listen(4000,() => {

    console.log("Server Running at port 4000")
})
