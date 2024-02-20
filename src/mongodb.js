const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// connection creation
mongoose.connect(process.env.databaseURL2)
    .then(() => { console.log("Connection successfull...") })
    .catch((err) => { console.log(err) });