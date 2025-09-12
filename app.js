
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


const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

mongoose.connect("mongodb+srv://alexlison:alexlison6885@cluster0.bz3d6.mongodb.net/PawDermaDb?retryWrites=true&w=majority&appName=Cluster0")

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
      // Prevent ownership change
      if (updateCatData.catOwner_id) {
        delete updateCatData.catOwner_id;
      }

      // Handle image update (if file uploaded via Postman)
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
          delete updateData.password; // ensure no accidental overwrite
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





app.listen(4000,() => {

    console.log("Server Running at port 4000")
})
