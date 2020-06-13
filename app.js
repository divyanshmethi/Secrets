//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
//We dont need to require passport-local because it is one of those dependencies which would be needed by
//passport-local-mongoose
const passportLocalMongoose = require('passport-local-mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');

// const saltRounds = 10;
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

app.use(session({
  secret: process.env.SECRET, //Long string of your choice,save it in env file
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize()); //Sets up passport for authentication
app.use(passport.session());  //We are going to use passport for dealing with session as well

mongoose.connect("mongodb://localhost:27017/usersDB",{useNewUrlParser:true,useUnifiedTopology: true,useCreateIndex:true});

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportLocalMongoose); //This is what we are going to use to hash and salt our passowrd and save
//users to mongoDB database

//We will use this secret to encrypt our DB
//We will add mongoose-encryption as a plugin to our userSchema and pass in the secret value
// userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields: ['password'] });



const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy());  //Use passportLocalMongoose to create a local login strategy
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/logout",function(req,res){
  //logout our users and end their sessions
  req.logout();
  res.redirect("/");
});

app.get("/secrets",function(req,res){
  //Here we will check if the user is already logged in using session, passport,passportLocalMongoose
  //If logged in --> render secrets
  //not --> redirect them to login route
  if(req.isAuthenticated()){
    res.render("secrets")
  }
  else {
    res.redirect("/login");
  }
});

app.post("/register",function(req,res){
  //Register function comes from passport-local-mongoose package, becoz of this we can avoid interacting directly with mongoose
  //passport-local-mongoose --> middleman to handle all of that
  User.register({username:req.body.username}, req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");  //So that they can try registering again
    }else {
      //No errors --> Authenticate our users using passport
      passport.authenticate("local")(req, res, function(){  //type of authentication --> local
        //This is triggered only if the authentication was successful
        //We were successful in creating cookie that saved in their logged in session
        res.redirect("/secrets");
        //Previosly we never had a secrets route coz we always relied on login and register routes to render secrets page
        //Here in this case coz we are authenticating a user and setting up a logged in session for them
        //So they can directly go to the secrets page and still be able to see it if they still have the cookie
        //i.e. they are still logged in
      });
    }
  });

  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   //Create a used once we have created the hash
  //   const newUser = new User({
  //     email : req.body.username,
  //     password : hash
  //   });
  //   newUser.save(function(err){
  //     if(err)
  //     {
  //       console.log(err);
  //     }
  //     else {
  //       res.render("secrets");
  //     }
  //   });
  // });

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
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  //Use passport to login and authenticate this user, login() --> passport
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

  // const username = req.body.username;
  // //const password = md5(req.body.password);
  // const password = req.body.password;
  // User.findOne({email : username},function(err,user){
  //   if(err)
  //   {
  //     console.log(err);
  //   }
  //   else {
  //     if(user)
  //     {
  //       // if(user.password == password)
  //       // {
  //       //   res.render("secrets");
  //       // }
  //       bcrypt.compare(password, user.password , function(err, result) {
  //         if(result === true)
  //         {
  //           res.render("secrets");
  //         }
  //       });
  //     }
  //   }
  // });
});

app.listen(5000,function(){
  console.log("Server started at port 5000");
});
