//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// const encrypt=require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt=require('bcrypt');
// const saltRounds = 10;
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// ****************************************************
app.use(session({
    secret: 'myfirstsecret.',
    resave: false,
    saveUninitialized:false
  }));

  app.use(passport.initialize());
  app.use(passport.session());


// ****************************************************
mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex',true);
// to be able to safe!!!
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User=new mongoose.model('User',userSchema);
// model name-> User
// collection name->users
passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
//-----------------------------------------------------
passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3030/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// ****************************************************
app.get('/',(req,res)=>{
    res.render('home');
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }
));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


// ****************************************************
app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/login',(req,res)=>{
   const user=new User({
       username:req.body.username,
       password:req.body.password
   });
//  this method comes from passportjs
   req.login(user,(err)=>{
       if(err){
           console.log(err);
       }else{
        passport.authenticate('local')(req,res,()=>{
            res.redirect('/secrets')
        })
    }
   })
});
// ****************************************************
app.get('/secrets',(req,res)=>{
  User.find({'secret':{$ne:null}},(err,foundUsers)=>{
      if(err){
          console.log(err)
      }else{
          if(foundUsers){
              res.render('secrets',{usersWithSecret:foundUsers})
          }
      }
  })
});
// *****************************************
app.get('/submit',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login')
    }
});

app.post('/submit',(req,res)=>{
    const submittedSecret=req.body.secret
    console.log(req.user.id);

    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save(()=>{
                    res.redirect('/secrets')
                })
            }
        }
    })
});
// ---------------------------------------------------
app.get('/logout',(req,res)=>{
    //  this method comes from passportjs
    req.logout();
    res.redirect('/');
})
// *****************************************************
app.get('/register',(req,res)=>{
    res.render('register');
});

app.post('/register',(req,res)=>{

    User.register({username:req.body.username}, req.body.password ,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets')
            })
        }
    })
   
});
// *****************************************************


// *****************************************************

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3030;
}


app.listen(port, function() {
  console.log("Server started on port 3030");
});