
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

mongoose.connect("mongodb+srv://alexlison:alexlison6885@cluster0.bz3d6.mongodb.net/PawDermaDb?retryWrites=true&w=majority&appName=Cluster0")


app.post("/signup",(req,res) => {

    res.json({"status":"Sucess"})

})

app.listen(4000,() => {

    console.log("Server Running at port 4000")
})
