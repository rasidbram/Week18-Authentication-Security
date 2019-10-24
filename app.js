//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt=require('mongoose-encryption');

const app = express();

console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// ****************************************************
mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser: true, useUnifiedTopology: true })
// to be able to safe!!!
const userSchema=new mongoose.Schema({
    email:String,
    password:String
});

userSchema.plugin(encrypt,{secret:process.env.SECRET, encryptedFields: ['password']});

// basic method
// const userSchema={
//     email:String,
//     password:String
// };

const User=new mongoose.model('User',userSchema);
// model name-> User
// collection name->users

// ****************************************************
app.get('/',(req,res)=>{
    res.render('home');
});
// ****************************************************
app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/login',(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;

    User.findOne({email:username},(err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.password===password){
                    res.render('secrets')
                }
            }
        }
    })

});
// *****************************************************
app.get('/register',(req,res)=>{
    res.render('register');
});

app.post('/register',(req,res)=>{
    // to be able to send to database in userDB
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save((err)=>{
        if(!err){
            res.render('secrets')
        }else{
            console.log(err)
        }
    });
});

// *****************************************************
app.listen(3030,function(){
    console.log('Server is running on port 3030')
})