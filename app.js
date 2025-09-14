
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




const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))


// ======== ADD RAZORPAY INITIALIZATION HERE ========
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RGywSXNw2dqMO2", 
  key_secret: process.env.RAZORPAY_KEY_SECRET || "7f1ss7rwYW5Vd9GKnViMp1Hh" 
});
// ==================================================



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


// -------------------------- RazorPay Integration --------------------------- //

app.post("/create-order", async (req, res) => {
  let token = req.headers.token;
  const { amount, appointment_id } = req.body;

  jwt.verify(token, "PawDermaKEY", async (error, decoded) => {
    if (error || !decoded || decoded.userType !== "cat_owner") {
      return res.json({ "Status": "Invalid Authentication" });
    }

    try {
      // CHECK 1: Verify appointment exists and get its bookingType
      const appointment = await appointmentModel.findById(appointment_id);
      if (!appointment) {
        return res.json({ 
          "Status": "Error", 
          "Message": "Appointment not found" 
        });
      }

      // CHECK 2: Prevent payment if appointment is already CONFIRMED/COMPLETED
      if (appointment.status !== "PENDING") {
        return res.json({ "Status": "AlreadyConfirmed"});
      }

  
      // CHECK 3: Prevent duplicate payments for this appointment
      const existingPayment = await PaymentModel.findOne({
        appointment_id: appointment_id,
        status: { $in: ["created", "paid"] } // Check for active or completed payments
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

      // Convert amount to paise (Razorpay expects amount in smallest currency unit)
      const amountInPaise = amount * 100;
      
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${appointment_id}`,
        payment_capture: 1 
        
      };

      // Create order in Razorpay
      const order = await razorpay.orders.create(options);
      
      // Create payment record in database
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
      // Create expected signature - USE THE SAME KEY AS RAZORPAY INIT
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", razorpay.key_secret) 
        .update(body.toString())
        .digest("hex");


      // Verify signature
      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        await PaymentModel.findByIdAndUpdate(payment_id, {
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
          updated_at: Date.now()
        });

        // Find the appointment linked to this payment
        const paymentRecord = await PaymentModel.findById(payment_id);
        
        // Update appointment status to "CONFIRMED"
        await appointmentModel.findByIdAndUpdate(
          paymentRecord.appointment_id, 
          { 
            status: "CONFIRMED",
            payment_status: "paid"
          }
        );

        res.json({ "Status": "Success", appointmentId: paymentRecord.appointment_id });
      } else {
        // Signature verification failed
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
      const appointment = await appointmentModel.findById(appointmentId)
        .populate("catOwner_id", "fname mname lname phone")
        .populate("catId", "name")
        .populate({
          path: "scheduleId",
          populate: { path: "doctorId", select: "fname mname lname qualification" },
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

      const primaryColor = "#9d1328"; // dark red

      // ---------------- HEADER ----------------
      try {
        const logoPath = path.join(__dirname, "uploads", "pawderma-logo.png");
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 40, { width: 110, height: 50 });
        }
      } catch (err) {
        console.log("Logo not found, skipping...");
      }

      // Clinic Info (right)
      doc.fontSize(10).fillColor("#000").font("Helvetica")
        .text("MC Road, Thrissur", 400, 50, { align: "right" })
        .text("Kerala 682001", 400, 65, { align: "right" })
        .text("Phone: +91 7836627882", 400, 80, { align: "right" })
        .text("Email: pawderma@gmail.com", 400, 95, { align: "right" });

  
      const marginSpace = 25;
      const lineYPosition = 95 + marginSpace; 

      doc.moveTo(50, lineYPosition)   
        .lineTo(550, lineYPosition)   
        .stroke();
    
      doc.moveDown(5) 

      // Title centered
      doc.fontSize(13).fillColor(primaryColor).font("Helvetica-Bold")
        .text("APPOINTMENT RECEIPT", 0, 130, { align: "center", underline: true });

      // ---------------- RECEIPT INFO ----------------
      const now = new Date();
      doc.fontSize(10).fillColor("#000").font("Helvetica-Bold")
        .text(`Receipt No: PD-${appointmentId.toString().slice(-6)}`, 50, 170)
        .font("Helvetica")
        .text(`Date: ${now.toLocaleDateString()}`, 400, 170, { align: "right" })
        .text(`Time: ${now.toLocaleTimeString()}`, 400, 185, { align: "right" });

      // ---------------- CUSTOMER (bordered card) ----------------
      doc.moveDown(2);
      const custTop = doc.y;
      doc.rect(50, custTop, 500, 70).stroke(); // card border
      doc.rect(50, custTop, 500, 20).fill(primaryColor).stroke(); // header background
      doc.fillColor("#fff").font("Helvetica-Bold").text("Customer Details", 55, custTop + 5);

      doc.fillColor("#000").font("Helvetica").fontSize(10);
      doc.text(
        `Name: ${appointment.catOwner_id.fname} ${appointment.catOwner_id.mname || ""} ${appointment.catOwner_id.lname}`,
        60,
        custTop + 30
      );
      doc.text(`Phone: ${appointment.catOwner_id.phone || "N/A"}`, 60, custTop + 50);

      doc.moveDown(5);

      // ---------------- APPOINTMENT ----------------
      doc.rect(50, doc.y, 500, 20).fill(primaryColor).stroke();
      doc.fillColor("#fff").font("Helvetica-Bold").text("Appointment Details", 55, doc.y + 5);
      doc.moveDown(2);

      // Table headers
      const tableTop = doc.y;
      const colWidths = [50, 70, 120, 100, 80, 80];
      const headers = ["Token", "Date", "Doctor", "Qualification", "Type", "Cat"];

      let x = 50;
      headers.forEach((h, i) => {
        doc.rect(x, tableTop, colWidths[i], 20).fill(primaryColor).stroke();
        doc.fillColor("#fff").font("Helvetica-Bold").fontSize(10)
          .text(h, x, tableTop + 5, { width: colWidths[i], align: "center" });
        x += colWidths[i];
      });

      // Table row
      const rowTop = tableTop + 20;
      const doctorName = `${appointment.scheduleId.doctorId.fname} ${appointment.scheduleId.doctorId.lname}`;
      const rowData = [
        appointment.token,
        appointment.appointmentDate.toLocaleDateString(),
        doctorName,
        appointment.scheduleId.doctorId.qualification,
        appointment.bookingType,
        appointment.catId.name,
      ];

      x = 50;
      rowData.forEach((d, i) => {
        doc.rect(x, rowTop, colWidths[i], 20).stroke();
        doc.fillColor("#000").font("Helvetica").fontSize(10)
          .text(d.toString(), x, rowTop + 5, { width: colWidths[i], align: "center" });
        x += colWidths[i];
      });

      // ---------------- PAYMENT ----------------
      doc.moveDown(4);
      const payTop = doc.y;
      doc.rect(50, payTop, 500, 80).stroke(); // card border
      doc.rect(50, payTop, 500, 20).fill(primaryColor).stroke(); // header bg
      doc.fillColor("#fff").font("Helvetica-Bold").text("Payment Details", 55, payTop + 5);

      doc.fillColor("#000").font("Helvetica").fontSize(10);
      doc.text(`Amount: INR ${payment.amount}`, 60, payTop + 30);
      
      doc.font('Helvetica')
         .fillColor('#000000')   
         .text('Status:', 60, payTop + 45);                      

      
      doc.font('Helvetica-Bold')      
      .fillColor(payment.status.toLowerCase() === "paid" ? "#0caf2c" : "red")
      .text(payment.status.toUpperCase(), 60 + doc.widthOfString('Status: ') + 2, payTop + 45);
      doc.fillColor("#000").text(`Payment Date: ${payment.updated_at.toLocaleDateString()}`, 60, payTop + 60);

      // ---------------- FOOTER ----------------
      doc.moveTo(50, 750).lineTo(550, 750).stroke();

      doc.moveDown(2);
      doc.fontSize(9).fillColor("#000")
          
       .text("Thank you for choosing PawDerma for your pet care needs.", 50, 770, { 
       align: "center" 
       });


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
      const appointments = await appointmentModel.find({ status: "CONFIRMED" })
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
        .populate("catId", "name breed")
        .populate("catOwner_id", "fname lname phone")
        .populate({
          path: "scheduleId",
          populate: { path: "doctorId", select: "fname lname qualification" }
        });

      if (!appointmentData) {
        return res.status(404).json({"Status": "AppointmentNotFound" });
      }

      let response = {
        _id: appointmentData._id,
        bookingType: appointmentData.bookingType,
        status: appointmentData.status,
        appointmentDate: appointmentData.appointmentDate,
        cat: appointmentData.catId,
        owner: appointmentData.catOwner_id,
        doctor: appointmentData.scheduleId?.doctorId || null,
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




app.listen(4000,() => {

    console.log("Server Running at port 4000")
})
