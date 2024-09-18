const express = require("express");
const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const saltRounds =10;
exports.postSignup = async (req, res, next) => {
    const { username } = req.body;
    const { email } = req.body;
    const { password } = req.body;
    const { contact } = req.body;
  
    try {
      const existingUser = await User.findOne({ where: { email } });
  
      if (existingUser) {
        return res.status(403).json({ message: "USER ALREADY EXISTS, PLEASE LOGIN" });
      } else {
          bcrypt.hash(password, saltRounds, async function(err, hash) {
              if(err){
                  return res.status(400).json({hash:"Couldn't hash error"});
              }else{
                  await User.create({
                      username: username,
                      email: email,
                      password: hash,
                      contact: contact
                    });
              }
          });
        
        res.status(201).json({ message: "Signup Completed!!" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };