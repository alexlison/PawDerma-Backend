
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const doctorModel = require("./models/Doctors")
const attenderModel = require("./models/Attenders")
const CatModel = require("./models/Cats")

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const CatOwnerModel = require("./models/CatOwners")
const doctorSchedulesModel = require("./models/DoctorSchedules")
const appointmentModel = require("./models/Appointments")

// ======== ADD RAZORPAY REQUIRE HERE ========
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PaymentModel = require("./models/Payments")
// ===========================================

const PDFDocument = require('pdfkit');
const medicalRecordModel = require("./models/MedicalRecords")
const { error } = require("console")
const attenderSchedulesModel = require("./models/AttenderSchedules")




const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))


// ======== ADD RAZORPAY INITIALIZATION HERE ========

// ==================================================
//mongo db connection 




// ----------------------- CatOwner Registration  ----------------------------------- //

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

// ----------------------- Login  ----------------------------------- //

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

  if (user.status === false) {
    return res.json({ "Status": "Deactivated" });
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

// ----------------------- Doctor Registration ----------------------------------- //

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

// ----------------------- Attender Registration  ----------------------------------- //

app.post("/attenderSignup",async (req,res) => {

  try{

      const inputData = req.body

        inputData.email = inputData.email.trim().toLowerCase()

        inputData.password = bcrypt.hashSync(inputData.password,10)

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

// ---------------- Cat Owner Details ----------------
app.post("/getCatOwnerById", async (req, res) => {
  try {
    const { id } = req.body;
    const user = await CatOwnerModel.findById(id); 
    if (!user) {
      return res.json({ Status: "NotFound" });
    }
    res.json({ Status: "Success", data: user });
  } catch (err) {
    console.error(err);
    res.json({ Status: "Error" });
  }
});

// ---------------- Doctor Details ----------------
app.post("/getDoctorById", async (req, res) => {
  try {
    const { id } = req.body;
    const user = await doctorModel.findById(id); 
    if (!user) {
      return res.json({ Status: "NotFound" });
    }
    res.json({ Status: "Success", data: user });
  } catch (err) {
    console.error(err);
    res.json({ Status: "Error" });
  }
});

// ---------------- Attender Details ----------------
app.post("/getAttenderById", async (req, res) => {
  try {
    const { id } = req.body;
    const user = await attenderModel.findById(id); 
    if (!user) {
      return res.json({ Status: "NotFound" });
    }
    res.json({ Status: "Success", data: user });
  } catch (err) {
    console.error(err);
    res.json({ Status: "Error" });
  }
});



// ----------------------- View All CatOwners ----------------------------------- //

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

// ----------------------- CatOwner Status Update ----------------------------------- //

app.post("/catOwnerStatusUpdate",async (req,res) => {

  try{

    const { _id }  = req.body
    
    if(!_id){

      res.json({"Status":"IdNotFound"})
    }

    const user = await CatOwnerModel.findById(_id)

    if(!user)
    {
      res.json({"Status":"UserNotFound"})
    }

    user.status = !user.status
    await user.save()


    res.json({"Status":"Success"})



  }catch(error){

    console.log("Error Fetching doctors Data",err);
    res.json({"Status":"Error"})

  }

})

// ------------------------------- Edit CatOwner Details ----------------------//

app.put("/updateCatOwner", (req, res) => {
  const token = req.headers.token;
  const updateData = { ...req.body };
  const catOwnerId = updateData.id; 

  if (!catOwnerId) {
    return res.json({ Status: "MissingCatOwnerId" });
  }



  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ Status: "Invalid Authentication" });
    }

  
    try {
      const catOwner = await CatOwnerModel.findById(catOwnerId);
      if (!catOwner) {
        return res.json({ "Status": "catOwnerNotFound" });
      }

      delete updateData.email;
      delete updateData.id; 

      if (updateData.oldPassword && updateData.newPassword) {
        const isMatch = await bcrypt.compare(updateData.oldPassword, catOwner.password);
        if (!isMatch) {
          return res.json({ "Status": "InvalidOldPassword" });
        }

        updateData.password = await bcrypt.hash(updateData.newPassword, 10);
        delete updateData.oldPassword;
        delete updateData.newPassword;
      } else {
        delete updateData.password;
      }

      if (updateData.phone) {
        const phoneExists = await CatOwnerModel.findOne({
          phone: updateData.phone,
          _id: { $ne: catOwnerId },
        });

        if (phoneExists) {
          return res.json({ "Status": "PhoneAlreadyExists" });
        }
      }

      const updatedData = await CatOwnerModel.findByIdAndUpdate(
        catOwnerId,
        updateData,
        { new: true }
      );

      res.json({ "Status": "Success" });
    } catch (err) {
      console.log("Error -->", err);
      res.json({ "Status": "Error" });
    }
  });
});





// ----------------------- View All Doctors  ----------------------------------- //

app.post("/viewDoctors",async (req,res) => {

  let token = req.headers.token

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {

    if(decoded && decoded.userType === "admin")
    {
      try {

        const doctorsData =  await doctorModel.find()

        res.json(doctorsData)
        
      } catch (error) {

        res.json({"Status":"Error"})
        
      }
    }else{

      res.json({"Status":"Invalid Authentication"})
    }
 
  });

});

// ----------------------- Doctor Status Update ----------------------------------- //

app.post("/doctorStatusUpdate",async (req,res) => {

  try {

    const { _id } = req.body
 
    if( !_id )
    {
      res.json({"Status":"IdNotFound"})

    }

    const doctor = await doctorModel.findById(_id)

    if( !doctor )
    {
      res.json({"Status":"UserNotFound"})
    }

    doctor.status = !doctor.status

    await doctor.save()

    res.json({"Status":"Success"})



  } catch (error) {

    console.log("Error Fetching doctors Data",err);
    res.json({"Status":"Error"})

    
  }
});

// ----------------------- View All Attenders ----------------------------------- //

app.post("/viewAttenders",async (req,res) => {

  let token = req.headers.token

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {

    if(decoded && decoded.userType === "admin")
    {
      try {

        const attenderData =  await attenderModel.find()

        res.json(attenderData)
        
      } catch (error) {

        res.json({"Status":"Error"})
        
      }
    }else{

      res.json({"Status":"Invalid Authentication"})
    }
 
  });

});


// ----------------------- Attender Status Update ----------------------------------- //


app.post("/attenderStatusUpdate",async (req,res) => {

  try {

    const { _id } = req.body
 
    if( !_id )
    {
      res.json({"Status":"IdNotFound"})

    }

    const attender = await attenderModel.findById(_id)

    if( !attender )
    {
      res.json({"Status":"UserNotFound"})
    }

    attender.status = !attender.status

    await attender.save()

    res.json({"Status":"Success"})



  } catch (error) {

    console.log("Error Fetching Attenders Data",err);
    res.json({"Status":"Error"})

    
  }
});


// ----------------------- Attender View ------------------------- //

app.post("/attenderView",async (req,res) => {

  let token = req.headers.token

  let  { userId }  = req.body

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {
    
    if(decoded && decoded.userType === "attender")
    {
      try {

        const attenderData = await attenderModel.findById(userId)

        if(!attenderData)
        {
          return res.json({"Status":"attenderNotFound"})
        }

        res.json(attenderData)
        
      } catch (err) {

        if(err)
        {
          res.json({"Status":"Error"})
        }
        
      }
    }else{

      res.json({"Status":"Invalid Authentication"})
    }

  })

});

// --------------------- Edit Attender ------------------------//

app.put("/updateAttender/:id", async (req, res) => {
  let token = req.headers.token;
  let attenderId = req.params.id; 
  let updateData = { ...req.body };

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (decoded && decoded.userType === "attender") {
      try {
       
        const attender = await attenderModel.findById(attenderId);
        if (!attender) {
          return res.json({ "Status": "AttenderNotFound" });
        }

      
        delete updateData.email;
        delete updateData.experience;


        if (updateData.oldPassword && updateData.newPassword) {
          const isMatch = await bcrypt.compare(updateData.oldPassword,attender.password);
          if (!isMatch) {
            return res.json({ "Status": "InvalidOldPassword" });
          }
  
          updateData.password = bcrypt.hashSync(updateData.newPassword,10);

          delete updateData.oldPassword;
          delete updateData.newPassword;
        } else {
          delete updateData.password; 
        }
       
      if (updateData.phone) {
        const phoneExists = await attenderModel.findOne({
         phone: updateData.phone,
         _id: { $ne: attenderId } 
         });

        if (phoneExists) {
           return res.json({ "Status": "PhoneAlreadyExists" });
        }
      }

        const updatedAttenderData = await attenderModel.findByIdAndUpdate(
          attenderId,
          updateData,
          { new: true }
        );

        res.json({ "Status": "Success" });
      } catch (error) {
        console.log("Error -->", error);
        res.json({ "Status": "Error" });
      }
    } else {
      res.json({ "Status": "Invalid Authentication" });
    }
  });
});

// ------------------------- Attender Schedules --------------------//

app.post("/attenderSchedules",async (req,res) => {

  let token = req.headers.token

  let inputData = req.body

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {
  
    if(decoded && decoded.userType === "attender")
    {
      try {

        const exists = await attenderSchedulesModel.findOne({
          attenderId:inputData.attenderId,
          date : inputData.date,
          vaccinationFrom : inputData.vaccinationFrom,
          vaccinationTo : inputData.vaccinationTo,
        });
        
          if (exists) {
          return res.json({ "Status": "ScheduleAlreadyExists" });
          }

        const newSchedule = new attenderSchedulesModel(inputData)
        await newSchedule.save() 

        res.json({"Status":"Success"})
        
      } catch (error) {

        
        res.json({ "Status": "Error" });
        
      }
    }else {
         res.json({ "Status": "Invalid Authentication" });
    }

  });

});

//--------------------------- Update Attender Schedules ---------------------------- //

// ------------- Attender Schedule Details fetch in Edit Form ------------------- //

app.get("/getAttenderSchedule/:id",async (req,res) => {

  let token = req.headers.token
  let scheduleId = req.params.id

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {

    if(decoded && decoded.userType === "attender")
    {
      try{

        const scheduleData = await attenderSchedulesModel.findById(scheduleId)

        if(!scheduleData)
        {
          return res.json({"Status":"scheduleNotFound"})
        }

        res.json(scheduleData)
      }catch(err){

      if(err)
      {
        console.log("Error -> ",err)
        res.json({"Status":"Error"})
      }
    }

  }else{

    res.json({"Status":"Invalid Authentication"})
  }
  });

});

//update api

app.put("/updateAttenderSchedule/:id", async (req, res) => {
  let token = req.headers.token;
  let scheduleId = req.params.id;   
  let updateScheduleData = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (decoded && decoded.userType === "attender") {
      try {
        
        delete updateScheduleData.attenderId;

        const exists = await attenderSchedulesModel.findOne({
          attenderId: decoded.userId, 
          date: updateScheduleData.date,
          vaccinationFrom: updateScheduleData.vaccinationFrom,
          vaccinationTo: updateScheduleData.vaccinationTo,
          _id: { $ne: scheduleId }, 
        });

        if (exists) {
          return res.json({"Status": "ScheduleAlreadyExists"});
        }

        const updateSchedule = await attenderSchedulesModel.findByIdAndUpdate(
          scheduleId,
          updateScheduleData,
          { new: true }
        );

        if (!updateSchedule) {
          return res.json({ "Status": "ScheduleIdNotFound" });
        }

        res.json({ "Status": "Success" });
      } catch (err) {
        console.error("Update Error:", err);
        res.json({"Status": "Error"});
      }
    } else {
      res.json({ "Status": "Invalid Authentication" });
    }
  });
});

// -------------------- View Attender Schedules --------------------- //

app.post("/viewAttenderSchedules", async (req, res) => {
  let token = req.headers.token;
  let { attenderId } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (decoded && decoded.userType === "attender") {
      try {
        const attenderSchedules = await attenderSchedulesModel.find({ attenderId: attenderId });


        if (!attenderSchedules || attenderSchedules.length === 0) {
          return res.json({ "Status": "SchedulesNotFound" });
        }

        res.json(attenderSchedules);

      } catch (err) {
        
        res.json({ "Status": "Error"});
      }
    } else {
      res.json({ "Status": "Invalid Authentication" });
    }
  });
});




// ----------------------- multer setup ----------------------- // 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads", "cats");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const catId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    const safeCatName = req.body.name
      ? req.body.name.replace(/\s+/g, "_").toLowerCase()
      : "cat";
    cb(null, `${catId}_${safeCatName}${ext}`);
  },
});

const upload = multer({ storage });

///


// ----------------------- Add Cat ----------------------------------- //

app.post("/addCat", upload.single("image"), async (req, res) => {
  try {
    const inputData = req.body;

    if (req.file) {
      inputData.image = `/uploads/cats/${req.file.filename}`;
    }

    const newCat = new CatModel(inputData);
    await newCat.save();

    res.json({ "Status": "Success" });
  } catch (err) {
    console.error("Error adding cat:", err);
    res.status(500).json({ Status: "Error" });
  }
});


// ----------------------- View All Cat ----------------------------------- //

app.post("/viewCats",async (req,res) => {

  let token = req.headers.token

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {

    if(decoded && decoded.userType === "admin")
    {
      try {

        const catsData = await CatModel.find().populate("catOwner_id","fname lname");
         res.json(catsData);
        
      } catch (err) {

         res.json({"Status":"Error"})
        
      }
    }else{

      res.json({"Status":"Invalid Authentication"})
    }
  });

});

// ----------------------- View MyCat ----------------------------------- //


app.post("/viewMyCats",async (req,res) => {

  let token = req.headers.token
  let { userId } = req.body;

  jwt.verify(token,"PawDermaKEY", async (error,decoded) => {

    if (decoded && decoded.userType === "cat_owner") {

      try {

          const usercatsData = await CatModel.find({catOwner_id: userId})

        res.json(usercatsData)
        
      } catch (error) {

         res.json({"Status":"Error"})
        
      }
      
    } else {

      res.json({"Status":"Invalid Authentication"})

      
    }
  });

});

// ----------------------- Update Cat ----------------------------------- //


app.put("/updateCat/:id", upload.single("image"), async (req, res) => {
  let token = req.headers.token;
  let catId = req.params.id;
  const updateCatData = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      if (updateCatData.catOwner_id) {
        delete updateCatData.catOwner_id;
      }

      if (req.file) {
        updateCatData.image = `/uploads/cats/${req.file.filename}`;
      }

      const updatedCatData = await CatModel.findByIdAndUpdate(catId, updateCatData, {
        new: true,
      });

      if (!updatedCatData) {
        return res.json({ "Status": "CatNotFound" });
      }

      res.json({"Status":"Success"});

    } catch (err) {
      console.error("Error updating cat:", err);
      res.json({ "Status": "Error" });
    }
  });
});


// ------------------------- retrieve cat details to fetch in form ---------------- //

app.get("/getCat/:id", async (req, res) => {
  const token = req.headers.token;
  const catId = req.params.id;

  if (!token) return res.json({ Status: "Invalid Authentication" });

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      const cat = await CatModel.findById(catId);
      if (!cat) return res.json({ "Status": "CatNotFound" });

      res.json({ Status: "Success", cat });
    } catch (err) {
      console.error("Error fetching cat:", err);
      res.json({ "Status": "Error" });
    }
  });
});

// ------------------- Doctor View ------------------- //

app.post("/doctorView",async (req,res) => {

  let token = req.headers.token

  let  { userId }  = req.body

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {
    
    if(decoded && decoded.userType === "doctor")
    {
      try {

        const doctorData = await doctorModel.findById(userId)

        if(!doctorData)
        {
          return res.json({"Status":"doctorNotFound"})
        }

        res.json(doctorData)
        
      } catch (err) {

        if(err)
        {
          res.json({"Status":"Error"})
        }
        
      }
    }else{

      res.json({"Status":"Invalid Authentication"})
    }

  })

});

// ------------------------------ Edit Doctor -------------------------- //


app.put("/updateDoctor/:id", async (req, res) => {
  let token = req.headers.token;
  let doctorId = req.params.id; 
  let updateData = { ...req.body };

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (decoded && decoded.userType === "doctor") {
      try {
       
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
          return res.json({ "Status": "DoctorNotFound" });
        }

        // Prevent updating restricted fields
        delete updateData.email;
        delete updateData.experience;


        if (updateData.oldPassword && updateData.newPassword) {
          const isMatch = await bcrypt.compare(updateData.oldPassword,doctor.password);
          if (!isMatch) {
            return res.json({ "Status": "InvalidOldPassword" });
          }
  
          updateData.password = bcrypt.hashSync(updateData.newPassword,10);

          // Remove temp fields so they don't overwrite
          delete updateData.oldPassword;
          delete updateData.newPassword;
        } else {
          delete updateData.password; 
        }
       
      if (updateData.phone) {
        const phoneExists = await doctorModel.findOne({
         phone: updateData.phone,
         _id: { $ne: doctorId } 
         });

        if (phoneExists) {
           return res.json({ "Status": "PhoneAlreadyExists" });
        }
      }

        const updatedDoctorData = await doctorModel.findByIdAndUpdate(
          doctorId,
          updateData,
          { new: true }
        );

        res.json({ "Status": "Success" });
      } catch (error) {
        console.log("Error -->", error);
        res.json({ "Status": "Error" });
      }
    } else {
      res.json({ "Status": "Invalid Authentication" });
    }
  });
});


// ------------------------- retrieve Doctor details to fetch in Edit form ---------------- //

app.get("/getDoctor/:id",async (req,res) => {

  let token = req.headers.token
  let doctorId = req.params.id

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {

    if(decoded && decoded.userType === "doctor")
    {
      try{

        const doctorData = await doctorModel.findById(doctorId)

        if(!doctorData)
        {
          return res.json({"Status":"DoctorNotFound"})
        }

        res.json(doctorData)
      }catch(err){

      if(err)
      {
        console.log("Error -> ",err)
        res.json({"Status":"Error"})
      }
    }

  }else{

    res.json({"Status":"Invalid Authentication"})
  }
  });

});


// ---------------------------- Doctor Schedule Slots ---------------------- //

app.post("/doctorSchedules",async (req,res) => {

  let token = req.headers.token

  let inputData = req.body

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {
  
    if(decoded && decoded.userType === "doctor")
    {
      try {

        const exists = await doctorSchedulesModel.findOne({
          doctorId:inputData.doctorId,
          date : inputData.date,
          consultationFrom : inputData.consultationFrom,
          consultationTo : inputData.consultationTo,
        });
        
          if (exists) {
          return res.json({ Status: "ScheduleAlreadyExists" });
          }

        const newSchedule = new doctorSchedulesModel(inputData)
        await newSchedule.save() 

        res.json({"Status":"Success"})
        
      } catch (error) {

        
        res.json({ Status: "Error" });
        
      }
    }else {
         res.json({ Status: "Invalid Authentication" });
    }

  });

});


// ---------------------------- view Doctor Schedules ------------------------ //

app.post("/viewDoctorSchedules", async (req, res) => {
  let token = req.headers.token;
  let { doctorId } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (decoded && decoded.userType === "doctor") {
      try {
        const doctorSchedules = await doctorSchedulesModel.find({ doctorId: doctorId });


        if (!doctorSchedules || doctorSchedules.length === 0) {
          return res.json({ "Status": "SchedulesNotFound" });
        }

        res.json(doctorSchedules);
      } catch (err) {
        
        res.json({ "Status": "Error"});
      }
    } else {
      res.json({ "Status": "Invalid Authentication" });
    }
  });
});



// --------------------------- Update Doctor Schedule ----------------------- //

app.put("/updateSchedule/:id", async (req, res) => {
  let token = req.headers.token;
  let scheduleId = req.params.id;   
  let updateScheduleData = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (decoded && decoded.userType === "doctor") {
      try {
        
        delete updateScheduleData.doctorId;

        const exists = await doctorSchedulesModel.findOne({
          doctorId: decoded.userId, 
          date: updateScheduleData.date,
          consultationFrom: updateScheduleData.consultationFrom,
          consultationTo: updateScheduleData.consultationTo,
          _id: { $ne: scheduleId }, 
        });

        if (exists) {
          return res.json({"Status": "ScheduleAlreadyExists"});
        }

        const updateSchedule = await doctorSchedulesModel.findByIdAndUpdate(
          scheduleId,
          updateScheduleData,
          { new: true }
        );

        if (!updateSchedule) {
          return res.json({ Status: "ScheduleIdNotFound" });
        }

        res.json({ "Status": "Success" });
      } catch (err) {
        console.error("Update Error:", err);
        res.json({"Status": "Error"});
      }
    } else {
      res.json({ "Status": "Invalid Authentication" });
    }
  });
});

// ------------------------ fetch Data in update Schedule Form ----------------- //

app.get("/getSchedule/:id",async (req,res) => {

  let token = req.headers.token
  let scheduleId = req.params.id

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {

    if(decoded && decoded.userType === "doctor")
    {
      try{

        const scheduleData = await doctorSchedulesModel.findById(scheduleId)

        if(!scheduleData)
        {
          return res.json({"Status":"scheduleNotFound"})
        }

        res.json(scheduleData)
      }catch(err){

      if(err)
      {
        console.log("Error -> ",err)
        res.json({"Status":"Error"})
      }
    }

  }else{

    res.json({"Status":"Invalid Authentication"})
  }
  });

});


//------------------------------ General Consultation ----------------------------//

// ------------------------- Get doctor details for  General Appointment Booking ---------------------------- // 

app.get("/getDoctorDetails",async (req,res) => {

  let token = req.headers.token
  let booking_date = req.query.date

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {
   
    if(decoded && decoded.userType === "cat_owner")
    {
      try {

        const availableDoctors = await doctorSchedulesModel.find({
          date: booking_date,
          remaining_slots: {$gt : 0},
        }).populate("doctorId");

        if (!availableDoctors || availableDoctors.length === 0)
        {
          return res.json({"Status":"NoDoctorsForTHisDate"})
        }

        res.json(availableDoctors)

        
      } catch (err) {

        if(err)
        {
          console.log("Error --> ",err)
          res.json({"Status":"Error"})
        }
        
      }
    }else{

      res.json({"Status":"Invalid Authentication"})
    }

  });
});



//------------------------------ General Appointment Booking ---------------------------//
app.post("/generalBooking", async (req, res) => {
  const token = req.headers.token;
  const BookingData = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ Status: "Invalid Authentication" });
    }

    try {
      const { catId, scheduleId, date, symptoms } = BookingData;

      const schedule = await doctorSchedulesModel.findOneAndUpdate(
        {
          _id: scheduleId,
          remaining_slots: { $gt: 0 },
        },
        { $inc: { remaining_slots: -1 } },
        { new: true }
      );

      if (!schedule) {
        return res.json({ Status: "NoAvailableSlot" });
      }

      const existingAppointment = await appointmentModel.findOne({
        catId,
        scheduleId,
      });

      if (existingAppointment) {
        await doctorSchedulesModel.findByIdAndUpdate(schedule._id, {
          $inc: { remaining_slots: 1 },
        });
        return res.json({ Status: "DuplicateBookingNotAllowed" });
      }

      const tokenNumber = (await appointmentModel.countDocuments({ scheduleId })) + 1;

      const newAppointment = new appointmentModel({
        catOwner_id: decoded.userId,
        catId,
        scheduleId,
        appointmentDate: new Date(date),
        symptoms,
        token: tokenNumber,
        bookingType: "GENERAL",
      });

      await newAppointment.save();

      res.json({ Status: "Success", appointmentId: newAppointment._id });
    } catch (err) {
      console.error("Error -->", err);
      res.json({ Status: "Error" });
    }
  });
});


//------------------------------ Vaccination  ----------------------------//

// ------------------------- Get Attender details for Vaccination Booking ---------------------------- // 

app.get("/getAttenderDetails",async (req,res) => {

  let token = req.headers.token
  let booking_date = req.query.date

  jwt.verify(token,"PawDermaKEY",async (error,decoded) => {
   
    if(decoded && decoded.userType === "cat_owner")
    {
      try {

        const availableAttenders = await attenderSchedulesModel.find({
          date: booking_date,
          remaining_slots: {$gt : 0},
        }).populate("attenderId");

        if (!availableAttenders || availableAttenders.length === 0)
        {
          return res.json({"Status":"NoAttendersForTHisDate"})
        }

        res.json(availableAttenders)

        
      } catch (err) {

        if(err)
        {
          console.log("Error --> ",err)
          res.json({"Status":"Error"})
        }
        
      }
    }else{

      res.json({"Status":"Invalid Authentication"})
    }

  });
});


//------------------------------ Vaccination Appointment Booking ---------------------------//

app.post("/vaccinationBooking", async (req, res) => {
  const token = req.headers.token;
  const BookingData = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      const { catId, vaccineScheduleId, date, vaccine } = BookingData;

      const alreadyTaken = await appointmentModel.findOne({
        catId,
        vaccine,
        bookingType: "VACCINATION",
      });

      if (alreadyTaken) {
        return res.json({ "Status": "VaccineAlreadyTaken" });
      }

      const schedule = await attenderSchedulesModel.findOneAndUpdate(
        {
          _id: vaccineScheduleId,
          remaining_slots: { $gt: 0 },
        },
        { $inc: { remaining_slots: -1 } },
        { new: true }
      );

      if (!schedule) {
        return res.json({ "Status": "NoAvailableSlot" });
      }

      const existingAppointment = await appointmentModel.findOne({
        catId,
        vaccineScheduleId,
      });

      if (existingAppointment) {
        await attenderSchedulesModel.findByIdAndUpdate(schedule._id, {
          $inc: { remaining_slots: 1 },
        });
        return res.json({ "Status": "DuplicateBookingNotAllowed" });
      }

      const tokenNumber =
        (await appointmentModel.countDocuments({ vaccineScheduleId })) + 1;

      const newAppointment = new appointmentModel({
        catOwner_id: decoded.userId,
        catId,
        vaccineScheduleId,
        appointmentDate: new Date(date),
        vaccine,
        token: tokenNumber,
        bookingType: "VACCINATION",
      });

      await newAppointment.save();

      res.json({ "Status": "Success", appointmentId: newAppointment._id });
    } catch (err) {
      console.error("Error -->", err);
      res.json({ "Status": "Error" });
    }
  });
});



// -------------------------- RazorPay Integration --------------------------- //

app.post("/create-order", async (req, res) => {
  let token = req.headers.token;
  const { amount, appointment_id } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      const appointment = await appointmentModel.findById(appointment_id);
      if (!appointment) {
        return res.json({ 
          "Status": "Error", 
          "Message": "Appointment not found" 
        });
      }

      if (appointment.status !== "PENDING") {
        return res.json({ "Status": "AlreadyConfirmed"});
      }

  
      const existingPayment = await PaymentModel.findOne({
        appointment_id: appointment_id,
        status: { $in: ["created", "paid"] } 
      });

      if (existingPayment) {
        return res.json({"Status": "AlreadyPaid",appointmentId: appointment_id});
      }

      const InCompletePayment = await PaymentModel.findOne({
        appointment_id : appointment_id,
        status: {$in : ["attempted","failed"]}
      });
      if(InCompletePayment)
      {
         return res.json({ "Status": "PaymentFailed"});
      }

      const amountInPaise = amount * 100;
      
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${appointment_id}`,
        payment_capture: 1 
        
      };

      const order = await razorpay.orders.create(options);
      
      const payment = new PaymentModel({
        appointment_id,
        razorpay_order_id: order.id,
        amount: amount,
        status: "created"
      });
      
      await payment.save();

      res.json({
        Status: "Success",
        order: order,
        payment_id: payment._id,
        booking_type: appointment.bookingType 
      });
    } catch (err) {
      console.error("Razorpay order creation error:", err);
      res.json({ "Status": "Error", "Message": err.message });
    }
  });
});


// Test route to generate signature for Postman testing

app.post("/generate-test-signature", (req, res) => {
  const { order_id, payment_id } = req.body;
  
  const body = order_id + "|" + payment_id;
  const signature = crypto
    .createHmac("sha256", razorpay.key_secret)
    .update(body.toString())
    .digest("hex");

  res.json({
    order_id,
    payment_id,
    generated_signature: signature
  });
});


//verify payment 

app.post("/verify-payment", async (req, res) => {
  let token = req.headers.token;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", razorpay.key_secret) 
        .update(body.toString())
        .digest("hex");


      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        await PaymentModel.findByIdAndUpdate(payment_id, {
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
          updated_at: Date.now()
        });

        const paymentRecord = await PaymentModel.findById(payment_id);
        
        await appointmentModel.findByIdAndUpdate(
          paymentRecord.appointment_id, 
          { 
            status: "CONFIRMED",
            payment_status: "paid"
          }
        );

        res.json({ "Status": "Success", appointmentId: paymentRecord.appointment_id });
      } else {
        await PaymentModel.findByIdAndUpdate(payment_id, {
          status: "failed",
          updated_at: Date.now()
        });
        
        res.json({ "Status": "Error", "Message": "Payment verification failed" });
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      res.json({ "Status": "Error", "Message": err.message });
    }
  });
});

// ----------------------- Generate Receipt PDF --------------------------- //
app.get("/api/generate-receipt/:appointmentId", async (req, res) => {
  let token = req.headers.token;
  const { appointmentId } = req.params;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded) {
      return res.status(401).send("Invalid Authentication");
    }

    try {
      // Populate both doctorSchedule and attenderSchedule
      const appointment = await appointmentModel.findById(appointmentId)
        .populate("catOwner_id", "fname mname lname phone")
        .populate("catId", "name")
        .populate({
          path: "scheduleId",
          populate: { path: "doctorId", select: "fname mname lname qualification" },
        })
        .populate({
          path: "vaccineScheduleId",
          populate: { path: "attenderId", select: "Name qualification" },
        });

      if (!appointment) return res.status(404).send("Appointment not found");

      const payment = await PaymentModel.findOne({ appointment_id: appointmentId });
      if (!payment) return res.status(404).send("Payment not found");

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=receipt-${appointmentId}.pdf`
      );
      doc.pipe(res);

      const primaryColor = "#9d1328";

      // HEADER
      try {
        const logoPath = path.join(__dirname, "uploads", "pawderma-logo.png");
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 40, { width: 110, height: 50 });
        }
      } catch (err) {
        console.log("Logo not found, skipping...");
      }

      doc.fontSize(10).fillColor("#000").font("Helvetica")
        .text("MC Road, Thrissur", 400, 50, { align: "right" })
        .text("Kerala 682001", 400, 65, { align: "right" })
        .text("Phone: +91 7836627882", 400, 80, { align: "right" })
        .text("Email: pawderma@gmail.com", 400, 95, { align: "right" });

      doc.moveDown(3);

      // HR line before title
      doc.moveTo(50, 125).lineTo(550, 125).lineWidth(1).stroke(primaryColor);

      doc.fontSize(13).fillColor(primaryColor).font("Helvetica-Bold")
        .text("APPOINTMENT RECEIPT", 0, 135, { align: "center", underline: true });

      // RECEIPT INFO
      const now = new Date();
      const receiptNo = `PD-${appointmentId.toString().slice(-6)}`;
      
      // Receipt No with badge background - more visible color
      const receiptNoWidth = doc.widthOfString(`Receipt No: ${receiptNo}`) + 20;
      doc.rect(50, 170, receiptNoWidth, 18).fill("#fff3cd").stroke("#856404");
      doc.fontSize(10).fillColor("#000").font("Helvetica-Bold")
        .text(`Receipt No: ${receiptNo}`, 60, 175);

      doc.font("Helvetica").fillColor("#000")
        .text(`Date: ${now.toLocaleDateString()}`, 400, 175, { align: "right" })
        .text(`Time: ${now.toLocaleTimeString()}`, 400, 190, { align: "right" });

      // CUSTOMER
      doc.moveDown(2);
      const custTop = doc.y + 10;
      doc.rect(50, custTop, 500, 70).stroke();
      doc.rect(50, custTop, 500, 20).fill(primaryColor).stroke();
      doc.fillColor("#fff").font("Helvetica-Bold").text("Customer Details", 55, custTop + 5);

      doc.fillColor("#000").font("Helvetica").fontSize(10);
      doc.text(
        `Name: ${appointment.catOwner_id.fname} ${appointment.catOwner_id.mname || ""} ${appointment.catOwner_id.lname}`,
        60,
        custTop + 30
      );
      doc.text(`Phone: ${appointment.catOwner_id.phone || "N/A"}`, 60, custTop + 50);

      doc.moveDown(5);

      // APPOINTMENT DETAILS
      doc.rect(50, doc.y, 500, 25).fill(primaryColor).stroke();
      doc.fillColor("#fff").font("Helvetica-Bold").text("Appointment Details", 55, doc.y + 8);
      doc.moveDown(2);

      const tableTop = doc.y;
      let headers, colWidths, rowData;

      if (appointment.bookingType === "VACCINATION") {
        headers = ["Token", "Date", "Attender", "Qualification", "Vaccine", "Cat"];
        colWidths = [50, 70, 100, 100, 80, 70]; // Reduced widths to fit page

        const attenderName = appointment.vaccineScheduleId?.attenderId?.Name || "N/A";
        const attenderQual = appointment.vaccineScheduleId?.attenderId?.qualification || "N/A";
        const tokenWithBadge = appointment.token || "-";

        rowData = [
          tokenWithBadge,
          appointment.appointmentDate?.toLocaleDateString() || "-",
          attenderName,
          attenderQual,
          appointment.vaccine || "-",
          appointment.catId?.name || "-",
        ];
      } else {
        headers = ["Token", "Date", "Doctor", "Qualification", "Type", "Cat"];
        colWidths = [50, 70, 100, 100, 80, 70]; // Reduced widths to fit page

        const doctorName = appointment.scheduleId?.doctorId
          ? `${appointment.scheduleId.doctorId.fname} ${appointment.scheduleId.doctorId.lname}`
          : "N/A";
        const tokenWithBadge = appointment.token || "-";

        rowData = [
          tokenWithBadge,
          appointment.appointmentDate?.toLocaleDateString() || "-",
          doctorName,
          appointment.scheduleId?.doctorId?.qualification || "-",
          appointment.bookingType,
          appointment.catId?.name || "-",
        ];
      }

      // Calculate total width to ensure it fits (should be 470px max for A4 with margins)
      const totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      
      // Draw headers (keep same height)
      let x = 50;
      headers.forEach((h, i) => {
        doc.rect(x, tableTop, colWidths[i], 25).fill(primaryColor).stroke();
        doc.fillColor("#fff").font("Helvetica-Bold").fontSize(9) // Reduced font size
          .text(h, x + 2, tableTop + 8, { width: colWidths[i] - 4, align: "center" });
        x += colWidths[i];
      });

      // Row with increased padding
      const rowTop = tableTop + 25;
      x = 50;
      rowData.forEach((d, i) => {
        if (i === 0) { // Token column - add badge background
          doc.rect(x, rowTop, colWidths[i], 35).stroke();
          // Token badge background with stronger color
          const tokenBadgeWidth = Math.min(doc.widthOfString(d.toString()) + 12, colWidths[i] - 8);
          const tokenBadgeX = x + (colWidths[i] - tokenBadgeWidth) / 2;
          doc.rect(tokenBadgeX, rowTop + 8, tokenBadgeWidth, 18).fill("#d4edda").stroke("#28a745");
          doc.fillColor("#000").font("Helvetica-Bold").fontSize(9)
            .text(d.toString(), x + 2, rowTop + 15, { width: colWidths[i] - 4, align: "center" });
        } else {
          doc.rect(x, rowTop, colWidths[i], 35).stroke();
          doc.fillColor("#000").font("Helvetica").fontSize(9) // Reduced font size
            .text(d.toString(), x + 4, rowTop + 12, { width: colWidths[i] - 8, align: "left" });
        }
        x += colWidths[i];
      });

      // PAYMENT DETAILS
      doc.moveDown(4);
      const payTop = doc.y;
      doc.rect(50, payTop, 500, 80).stroke();
      doc.rect(50, payTop, 500, 20).fill(primaryColor).stroke();
      doc.fillColor("#fff").font("Helvetica-Bold").text("Payment Details", 55, payTop + 5);

      doc.fillColor("#000").font("Helvetica").fontSize(10);
      doc.text(`Amount: INR ${payment.amount}`, 60, payTop + 30);

      doc.font("Helvetica")
        .fillColor("#000")
        .text("Status:", 60, payTop + 45);

      doc.font("Helvetica-Bold")
        .fillColor(payment.status.toLowerCase() === "paid" ? "#0caf2c" : "red")
        .text(payment.status.toUpperCase(), 60 + doc.widthOfString("Status: ") + 2, payTop + 45);

      doc.fillColor("#000").text(`Payment Date: ${payment.updated_at.toLocaleDateString()}`, 60, payTop + 60);

      // FOOTER
      doc.moveTo(50, 750).lineTo(550, 750).stroke();
      doc.fontSize(9).fillColor("#000")
        .text("Thank you for choosing PawDerma for your pet care needs.", 50, 770, { align: "center" });

      doc.end();
    } catch (err) {
      console.error("Receipt generation error:", err);
      return res.status(500).send("Error generating receipt");
    }
  });
});

// ----------------------------- Doctor Appointments ------------------------------- //

function formatDate(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ----------------------- Doctor View Appointments --------------------------- //
app.post("/doctorAppointments", async (req, res) => {
  let token = req.headers.token;
  let { doctorId } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "doctor") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      const appointments = await appointmentModel.find({ status: { $in: ["CONFIRMED", "COMPLETED","NOTCOME"] } })
        .populate({
          path: "scheduleId",
          match: { doctorId: doctorId },
          populate: { path: "doctorId", select: "fname lname qualification" }
        })
        .populate("catOwner_id", "fname lname phone")
        .populate("catId", "name breed");

      const doctorAppointments = appointments.filter(appt => appt.scheduleId);

      // ---- Group by date ----
      const grouped = {};
      doctorAppointments.forEach(appt => {
        const dateKey = appt.scheduleId.date.toISOString().split("T")[0]; 
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push({
          token: appt.token,
           _id: appt._id,
          catName: appt.catId?.name,
          breed: appt.catId?.breed,
          catOwnerName: `${appt.catOwner_id?.fname} ${appt.catOwner_id?.lname}`,
          phone: appt.catOwner_id?.phone,
          bookingType: appt.bookingType,
          time: `${appt.scheduleId.consultationFrom} - ${appt.scheduleId.consultationTo}`,
          status: appt.status
        });
      });

      res.json({ Status: "Success", data: grouped });
    } catch (err) {
      console.error("Error fetching doctor appointments:", err);
      res.json({ "Status": "Error" });
    }
  });
});


// --------------------------- Add Prescription ---------------------------- //
app.get("/appointment-details/:appointmentId", async (req, res) => {
  let token = req.headers.token;
  const { appointmentId } = req.params;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "doctor") {
      return res.status(401).json({ "Status": "Invalid Authentication" });
    }

    try {
      const appointmentData = await appointmentModel
        .findById(appointmentId)
        .populate("catId", "name breed image dob")
        .populate("catOwner_id", "fname lname phone")
        .populate({
          path: "scheduleId",
          select: "consultationFrom consultationTo doctorId",
          populate: { path: "doctorId", select: "fname lname qualification specialization" }
        });

      if (!appointmentData) {
        return res.status(404).json({"Status": "AppointmentNotFound" });
      }

      let response = {
        _id: appointmentData._id,
        bookingType: appointmentData.bookingType,
        status: appointmentData.status,
        appointmentDate: appointmentData.appointmentDate,
        App_token: appointmentData.token, 
        cat: appointmentData.catId,
        owner: appointmentData.catOwner_id,
        doctor: appointmentData.scheduleId?.doctorId || null,
        consultationFrom: appointmentData.scheduleId?.consultationFrom || null,
        consultationTo: appointmentData.scheduleId?.consultationTo || null,
      };

      if (appointmentData.bookingType === "GENERAL") {
        response.symptoms = appointmentData.symptoms;
      }

      if (appointmentData.bookingType === "SKIN") {
        response.diseaseImage = appointmentData.skinAnalysis?.diseaseImage || null;
        response.predictedDisease = appointmentData.skinAnalysis?.predictedDisease || null;
        response.confidenceScore = appointmentData.skinAnalysis?.confidenceScore || null;
      }

      res.json(response);
      

    } catch (err) {
      console.error("Error fetching appointment details:", err);
      res.status(500).json({ "Status": "Error" });
    }
  });
});


app.post("/add-prescription/:appointmentId", async (req, res) => {
  const token = req.headers.token;
  const { appointmentId } = req.params;
  const { medicine, notes, followUpDate } = req.body;

  jwt.verify(token, "PawDermaKEY", async (err, decoded) => {
    if (err || !decoded || decoded.userType !== "doctor") {
      return res.status(401).json({ "Status": "Invalid Authentication" });
    }

    try {
      const appointment = await appointmentModel.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ "Status": "AppointmentNotFound" });
      }

      if (appointment.status === "COMPLETED") {
        return res.status(400).json({ "Status": "AlreadyCompleted" });
      }

      const recordData = {
        appointmentId: appointment._id,
        catId: appointment.catId,
        catOwner_id: appointment.catOwner_id,
        doctorId: decoded.userId,
        bookingType: appointment.bookingType,
        prescription: { medicine, notes, followUpDate: followUpDate || null }
      };

      if (appointment.bookingType === "GENERAL") {
        recordData.symptoms = appointment.symptoms;
      } else if (appointment.bookingType === "SKIN") {
        recordData.skinAnalysis = {
          diseaseImage: appointment.skinAnalysis?.diseaseImage || null,
          predictedDisease: appointment.skinAnalysis?.predictedDisease || null,
          confidenceScore: appointment.skinAnalysis?.confidenceScore || null
        };
      }

      const newRecord = await medicalRecordModel.create(recordData);

      appointment.status = "COMPLETED";
      await appointment.save();

      res.json({ "Status": "Success"});
    } catch (error) {
      console.error("Error adding prescription:", error);
      res.status(500).json({ "Status": "Error" });
    }
  });
});

// ----------------------- View Prescription --------------------- //

app.post("/viewPrescription", async (req, res) => {
  let token = req.headers.token;
  const { appointment_id } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "doctor") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      const medicalRecord = await medicalRecordModel
        .findOne({ appointmentId: appointment_id })
        .populate("catId", "name breed image dob")
        .populate("catOwner_id", "fname lname phone")
        .populate("doctorId", "fname lname qualification specialization");

      if (!medicalRecord) {
        return res.json({ "Status": "PrescriptionNotFound" });
      }

      const appointmentData = await appointmentModel
        .findById(appointment_id)
        .populate({
          path: "scheduleId",
          select: "consultationFrom consultationTo"
        });

      let response = {
        prescriptionId: medicalRecord._id,
        appointmentId: medicalRecord.appointmentId,
         appointmentDate: appointmentData.appointmentDate,
        App_token: appointmentData.token, 
        bookingType: medicalRecord.bookingType,
        createdAt: medicalRecord.createdAt,
        cat: medicalRecord.catId,
        owner: medicalRecord.catOwner_id,
        doctor: medicalRecord.doctorId,
        consultationFrom: appointmentData?.scheduleId?.consultationFrom || null,
        consultationTo: appointmentData?.scheduleId?.consultationTo || null,
        prescription: medicalRecord.prescription,
      };

      if (medicalRecord.bookingType === "GENERAL") {
        response.symptoms = medicalRecord.symptoms;
      }

      if (medicalRecord.bookingType === "SKIN") {
        response.skinAnalysis = medicalRecord.skinAnalysis || null;
      }

      res.json(response);

    } catch (err) {
      console.error("Error fetching prescription details:", err);
      res.json({ "Status": "Error" });
    }
  });
});


/// --------------------- Doctor Completed Cats For Medical Records ---------------- //

app.post("/doctorCompletedCats", async (req, res) => {
  try {
    const token = req.headers.token;
    const { doctorId } = req.body;

    jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
      if (error || !decoded || decoded.userType !== "doctor") {
        return res.json({ "Status": "Invalid Authentication" });
      }

      try {
        const appointments = await appointmentModel
          .find({ status: "COMPLETED" })
          .populate({
            path: "scheduleId",
            select: "doctorId",
          })
          .populate("catId", "name breed")
          .populate("catOwner_id", "fname lname phone");

        const filteredAppointments = appointments.filter(
          appt =>
            appt.scheduleId &&
            appt.scheduleId.doctorId.toString() === doctorId.toString()
        );

        if (!filteredAppointments.length) {
          return res.json({ "Status": "NotFound", data: [] });
        }

        const grouped = {};
        filteredAppointments.forEach(appt => {
          if (appt.catId && !grouped[appt.catId._id]) {
            grouped[appt.catId._id] = {
              catId: appt.catId._id,
              catName: appt.catId.name,
              breed: appt.catId.breed,
              ownerName: `${appt.catOwner_id?.fname} ${appt.catOwner_id?.lname}`,
              phone: appt.catOwner_id?.phone
            };
          }
        });

        return res.json({ "Status": "Success", data: Object.values(grouped) });
      } catch (err) {
        console.error("Error fetching doctor's completed cats:", err);
        return res.json({ "Status": "Error" });
      }
    });
  } catch (err) {
    console.error("Server error:", err);
   
  }
});



// ------------------------- Medical Record ---------------------------------- //

app.get("/medicalRecords/:catId", async (req, res) => {
  try {
    const token = req.headers.token;
    const { catId } = req.params;

    jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
      if (error || !decoded || decoded.userType !== "doctor") {
        return res.json({ "Status": "Invalid Authentication" });
      }

      const doctorId = decoded.userId;

    const appointments = await appointmentModel.find({
        catId,
        status: "COMPLETED",
      })
        .populate("catId", "name breed")
        .populate("catOwner_id", "fname lname phone")
        .populate({
          path: "vaccineScheduleId",
          select: "date",
          populate: { path: "attenderId", select: "Name qualification" },
        })
        .populate({
          path: "scheduleId",
          select: "doctorId date",
        });

      const filteredAppointments = appointments.filter(
        appt =>
          (appt.scheduleId && appt.scheduleId.doctorId.toString() === doctorId.toString()) ||
          appt.bookingType === "VACCINATION"
      );

      if (!filteredAppointments.length) {
        return res.json({ Status: "NotFound", data: [] });
      }

        const result = filteredAppointments.map((appt) => ({
        appointmentId: appt._id,
        bookingType: appt.bookingType,
        catName: appt.catId?.name,
        breed: appt.catId?.breed,
        ownerName: `${appt.catOwner_id?.fname || ""} ${appt.catOwner_id?.lname || ""}`.trim(),
        phone: appt.catOwner_id?.phone || "",
        status: appt.status,
        
        date:
          appt.bookingType === "VACCINATION"
            ? appt.vaccineScheduleId?.date
            : appt.scheduleId?.date || null,
        recordAction:
          appt.bookingType === "VACCINATION"
            ? {
                type: "vaccination",
                vaccineName: appt.vaccine || "Unknown",
                attender: appt.vaccineScheduleId?.attenderId?.Name || "N/A",
              }
            : {
                type: "prescription",
                button: "View Prescription",
              },
      }));

      res.json({ "Status": "Success", data: result });
    });
  } catch (err) {
    console.error("Error fetching doctor's completed records:", err);
    res.json({ "Status": "Error" });
  }
});

// -------------------------- View All Appointments Grouped by Date ------------------------- //

app.post("/viewAllAppointments", async (req, res) => {
  try {
    const token = req.headers.token;

    jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
      if (error || !decoded || decoded.userType !== "admin") {
        return res.json({ "Status": "Invalid Authentication" });
      }

      try {
        const appointments = await appointmentModel.find()
          .populate("catId", "name breed")
          .populate("catOwner_id", "fname lname phone")
          .populate({
            path: "scheduleId",
            populate: { path: "doctorId", select: "fname lname specialization" }
          })
          .populate({
            path: "vaccineScheduleId",
            populate: { path: "attenderId", select: "Name qualification" }
          });

        if (!appointments.length) {
          return res.json({ "Status": "NotFound", data: {} });
        }

        const grouped = {};

        appointments.forEach((appt, idx) => {
          let appointmentDate = "";
          let time = "";
          let personInCharge = "";
          const bookingType = appt.bookingType;

          let extras = {};

          // ---------------- Vaccination ----------------
          if (bookingType === "VACCINATION") {
            const vs = appt.vaccineScheduleId;
            if (vs && vs.date) appointmentDate = vs.date.toISOString().split("T")[0];
            time = vs ? `${vs.vaccinationFrom} - ${vs.vaccinationTo}` : "";
            personInCharge = vs?.attenderId ? `${vs.attenderId.Name}` : "N/A";

            extras = {
              vaccine: appt.vaccine || "", 
              attenderName: vs?.attenderId?.Name || "N/A",
              attenderQualification: vs?.attenderId?.qualification || ""
            };

          // ---------------- Skin ----------------
          } else if (bookingType === "SKIN") {
            const sch = appt.scheduleId;
            if (sch && sch.date) appointmentDate = sch.date.toISOString().split("T")[0];
            time = sch ? `${sch.consultationFrom} - ${sch.consultationTo}` : "";
            personInCharge = sch?.doctorId ? `${sch.doctorId.fname} ${sch.doctorId.lname}` : "N/A";

            extras = {
              skinAnalysis: {
                diseaseImage: appt.skinAnalysis?.diseaseImage || null,
                predictedDisease: appt.skinAnalysis?.predictedDisease || null,
                confidenceScore: appt.skinAnalysis?.confidenceScore ?? null
              },
              doctorName: sch?.doctorId ? `${sch.doctorId.fname} ${sch.doctorId.lname}` : "N/A",
              specialization: sch?.doctorId?.specialization || ""
            };

          // ---------------- General ----------------
          } else if (bookingType === "GENERAL") {
            const sch = appt.scheduleId;
            if (sch && sch.date) appointmentDate = sch.date.toISOString().split("T")[0];
            time = sch ? `${sch.consultationFrom} - ${sch.consultationTo}` : "";
            personInCharge = sch?.doctorId ? `${sch.doctorId.fname} ${sch.doctorId.lname}` : "N/A";

            extras = {
              symptoms: {
                fever: appt.symptoms?.fever || "no",
                vomiting: appt.symptoms?.vomiting || "no",
                cough: appt.symptoms?.cough || "no",
                loss_of_appetite: appt.symptoms?.loss_of_appetite || "no",
                diarrhea: appt.symptoms?.diarrhea || "no"
              },
              doctorName: sch?.doctorId ? `${sch.doctorId.fname} ${sch.doctorId.lname}` : "N/A",
              specialization: sch?.doctorId?.specialization || ""
            };

          } else {
            const sch = appt.scheduleId || appt.vaccineScheduleId;
            if (sch && sch.date) appointmentDate = sch.date.toISOString().split("T")[0];
            if (sch && sch.consultationFrom && sch.consultationTo)
              time = `${sch.consultationFrom} - ${sch.consultationTo}`;
            else if (sch && sch.vaccinationFrom && sch.vaccinationTo)
              time = `${sch.vaccinationFrom} - ${sch.vaccinationTo}`;
            personInCharge = "N/A";
            extras = {};
          }

          if (!appointmentDate) appointmentDate = "Unknown Date";

          const obj = {
            slNo: idx + 1,
            appointmentId: appt._id,
            appointmentDate,                 
            time,                            
            bookingType,
            catName: appt.catId?.name || "",
            breed: appt.catId?.breed || "",
            ownerName: `${appt.catOwner_id?.fname || ""} ${appt.catOwner_id?.lname || ""}`.trim(),
            phone: appt.catOwner_id?.phone || "",
            personInCharge,
            status: appt.status,
            ...extras
          };

          if (!grouped[appointmentDate]) grouped[appointmentDate] = [];
          grouped[appointmentDate].push(obj);
        });

        return res.json({ "Status": "Success", data: grouped });
      } catch (err) {
        console.error("Error fetching appointments:", err);
        return res.json({ "Status": "Error" });
      }
    });
  } catch (err) {
    console.error("Server Error:", err);

  }
});


// -------------------------- Attender View Vaccination ------------------------ //

app.post("/VaccinationsView", async (req, res) => {
  let token = req.headers.token;
  let { attenderId } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "attender") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      const attenderObjectId = mongoose.Types.ObjectId.isValid(attenderId)
        ? new mongoose.Types.ObjectId(attenderId)
        : null;

      const appointments = await appointmentModel
        .find({ status: { $in: ["CONFIRMED", "COMPLETED", "NOTCOME"] } })
        .populate({
          path: "vaccineScheduleId",
          match: { attenderId: attenderObjectId },
          populate: { path: "attenderId", select: "Name qualification" }
        })
        .populate("catOwner_id", "fname lname phone")
        .populate("catId", "name breed");

      const attenderAppointments = appointments.filter(
        appt => appt.vaccineScheduleId
      );

      const grouped = {};
      attenderAppointments.forEach(appt => {
        try {
          const rawDate = appt.vaccineScheduleId.date;

          const dateKey = rawDate instanceof Date
            ? rawDate.toISOString().split("T")[0]
            : new Date(rawDate).toISOString().split("T")[0];

          if (!grouped[dateKey]) grouped[dateKey] = [];

          grouped[dateKey].push({
            token: appt.token,
            _id: appt._id,
            catName: appt.catId?.name || "",
            breed: appt.catId?.breed || "",
            catOwnerName: `${appt.catOwner_id?.fname || ""} ${appt.catOwner_id?.lname || ""}`.trim(),
            phone: appt.catOwner_id?.phone || "",
            bookingType: appt.bookingType || "VACCINATION",
            time: `${appt.vaccineScheduleId.vaccinationFrom} - ${appt.vaccineScheduleId.vaccinationTo}`,
            status: appt.status,
          });
        } catch (err) {
          console.error("Invalid appointment date:", err);
        }
      });

      res.json({ "Status": "Success", data: grouped });
    } catch (err) {
      console.error("Error fetching attender vaccinations:", err);
      res.json({ "Status": "Error" });
    }
  });
});


// ------------------------ Attender Vaccination Status Update -----------------//
app.post("/vaccinationStatusUpdate/:appointment_id", async (req, res) => {
  try {
    const { appointment_id } = req.params;

    if (!appointment_id) {
      return res.json({ "Status": "IdNotFound" });
    }

    const vaccination = await appointmentModel.findById(appointment_id);

    if (!vaccination) {
      return res.json({ "Status": "VaccinationNotFound" });
    }

    vaccination.status = "COMPLETED";

    await vaccination.save();

    return res.json({ "Status": "Success" });

  } catch (error) {
    console.error("Error Fetching Vaccination Data:", error);
    return res.json({ "Status": "Error" });
  }
});




// ----------------------- View My Appointments ------------------------------ //

app.post("/viewMyAppointments", async (req, res) => {
  const token = req.headers.token;
  const { catOwner_id } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {

      const myAppointments = await appointmentModel
        .find({
          catOwner_id: catOwner_id,
          status: { $in: ["CONFIRMED", "COMPLETED", "NOTCOME"] },
        })
        .populate({
          path: "scheduleId",
          select: "consultationFrom consultationTo doctorId",
          populate: {
            path: "doctorId",
            select: "fname lname qualification specialization",
          },
        })
        .populate({
          path: "catId",
          select: "name breed image dob",
        });

      if (!myAppointments || myAppointments.length === 0) {
        return res.json({ "Status": "NoAppointments" });
      }

      const response = myAppointments.map((appt) => ({
        appointmentId: appt._id,
        bookingType: appt.bookingType,
        status: appt.status,
        appointmentDate: appt.appointmentDate,
        consultationFrom: appt.scheduleId?.consultationFrom || null,
        consultationTo: appt.scheduleId?.consultationTo || null,
        cat: appt.catId,
        doctor: appt.scheduleId?.doctorId || null,
      }));

      res.json(response);

    } catch (err) {
      console.error("Error fetching appointments:", err);
      res.json({ "Status": "Error" });
    }
  });
});



app.listen(4000,() => {

    console.log("Server Running at port 4000")
})
