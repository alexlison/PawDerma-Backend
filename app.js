
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


app.listen(4000,() => {

    console.log("Server Running at port 4000")
})
