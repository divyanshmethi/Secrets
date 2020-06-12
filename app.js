//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');

const saltRounds = 10;
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

mongoose.connect("mongodb://localhost:27017/usersDB",{useNewUrlParser:true,useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

//We will use this secret to encrypt our DB
//We will add mongoose-encryption as a plugin to our userSchema and pass in the secret value
// userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields: ['password'] });



const User = mongoose.model("user",userSchema);

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //Create a used once we have created the hash
    const newUser = new User({
      email : req.body.username,
      password : hash
    });
    newUser.save(function(err){
      if(err)
      {
        console.log(err);
      }
      else {
        res.render("secrets");
      }
    });
  });

  // const newUser = new User({
  //   email : req.body.username,
  //   password : md5(req.body.password)     //Use MD5 to turn the password into irreversible hash function
  // });
  // newUser.save(function(err){
  //   if(err)
  //   {
  //     console.log(err);
  //   }
  //   else {
  //     res.render("secrets");
  //   }
  // });
});

app.post("/login",function(req,res){
  const username = req.body.username;
  //const password = md5(req.body.password);
  const password = req.body.password;
  User.findOne({email : username},function(err,user){
    if(err)
    {
      console.log(err);
    }
    else {
      if(user)
      {
        // if(user.password == password)
        // {
        //   res.render("secrets");
        // }
        bcrypt.compare(password, user.password , function(err, result) {
          if(result === true)
          {
            res.render("secrets");
          }
        });
      }
    }
  });
});

app.listen(5000,function(){
  console.log("Server started at port 5000");
});
