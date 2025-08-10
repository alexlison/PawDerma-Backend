
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

app.listen(4000,() => {

    console.log("Server Running at port 4000")
})
