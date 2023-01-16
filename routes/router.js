// Libraries
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authenticate = require('../middleware/authenticate');
const { check, validationResult } = require('express-validator');

// Post register data
router.post('/register', [
  // Check Validation of Fields
  check('name').not().isEmpty().withMessage("Name can't be empty")
  .trim().escape(),

  check('number').not().isEmpty().withMessage("Number can't be empty")
  .isNumeric().withMessage("Number must only consist of digits")
  .isLength({
    max: 10,
    min: 10
  }).withMessage('Number must consist of 10 digits'),

  check('password').not().isEmpty().withMessage("Password can't be empty")
  .isLength({
    min: 6
  }).withMessage("Password must be at least 6 characters long")
  .matches(/\d/).withMessage("Password must contain a number")
  .isAlphanumeric().withMessage("Password can only contain alphabets and numbers"),

  check('confirmPassword').not().isEmpty().withMessage("Confirm Password can't be empty"),

  check('email').not().isEmpty().withMessage("Email can't be empty")
  .isEmail().withMessage("Email format is invalid")
  .normalizeEmail()

], async function (req, res) {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      "status": false,
      "message": errors.array()
    });
  } else {
    const {
      name,
      number,
      email,
      password,
      confirmPassword
    } = req.body;
    const errors = [];

    // Check Duplicate Emails
    User.findOne({
      email: email
    }, function (err, duplicateEmail) {
      if (err) {
        console.log(err);
      } else {
        if (duplicateEmail) {
          errors.push({
            msg: "Email already registered"
          });
          return res.status(400).json({
            "status": false,
            "message": errors
          })
        } else {
          // Check Duplicate Numbers
          User.findOne({
            number: number
          }, async function (err, duplicateNumber) {
            if (err) {
              console.log(err);
            } else {
              if (duplicateNumber) {
                errors.push({
                  msg: "Number already registered"
                });
                return res.status(400).json({
                  "status": false,
                  "message": errors
                })
              } else {
                // Check if Passwords Match
                if (password != confirmPassword) {
                  errors.push({
                    msg: "Passwords don't match"
                  })
                  return res.status(400).json({
                    "status": false,
                    "message": errors
                  })
                } else {
                  // Hashing the password
                  const saltRounds = 10;
                  const salt = await bcrypt.genSalt(saltRounds);
                  const hashedPassword = await bcrypt.hash(password, salt);

                  const newUser = new User({
                    name: name,
                    number: number,
                    email: email,
                    password: hashedPassword,
                    token: "null"
                  })

                  const savedUser = await newUser.save();

                  return res.status(201).json({
                    "status": true,
                    "message": "Registered successfully!",
                    "user": savedUser
                  })
                }
              }
            }
          })
        }
      }
    })
  }
})

// Post registered data / login 
router.post('/login', [
  // Check fields validation
  check('email').not().isEmpty().withMessage("Email can't be empty")
  .isEmail().withMessage("Email format invalid")
  .normalizeEmail(),

  check('password').not().isEmpty().withMessage("Password can't be empty")
  .isLength({
    min: 6
  }).withMessage("Password must be at least 6 characters long")
  .matches(/\d/).withMessage("Password must contain a number")
  .isAlphanumeric().withMessage("Password can only contain alphabets and numbers")

], async function (req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      "status": false,
      "message": errors.array()
    })
  } else {
    const {
      email,
      password
    } = req.body;
    const errors = [];

    // Check if email exists
    User.findOne({
      email: email
    }, async function (err, found) {
      if (err) {
        console.log(err);
      } else {
        if (!found) {
          errors.push({
            msg: "Incorrect Email or Password"
          });
          return res.status(400).json({
            "status": false,
            "message": errors
          })
        } else {
          // Comparing the password
          bcrypt.compare(password, found.password, async function (err, result) {
            if (result) {

              // Token generation
              const token = await found.generateAuthToken();

              found.token = token;
              await found.save();

              return res.status(201).json({
                "status": true,
                "message": "Logged in successfully!",
                "user": found
              })
            } else {
              errors.push({
                msg: "Incorrect Email or Password"
              });
              return res.status(400).json({
                "status": false,
                "message": errors
              })
            }
          });
        }
      }
    })
  }
})

// Verify if user is logged in
router.get('/getAuthUser', authenticate, async function (req, res) {
  if (req.rootUser) 
    return res.status(201).json({
      "status": true,
      "message": "User returned successfully!",
      "user": req.rootUser
    })
});

module.exports = router;