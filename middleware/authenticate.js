const jwt = require('jsonwebtoken');
const User = require('../models/User');
const secretKey = process.env.SECRET_KEY;

const authenticate = async function(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      console.log(authHeader)
      const token = authHeader.split(" ")[1];

      jwt.verify(token, secretKey, async (err, verifyToken) => {
        if (err) {
          res.status(401).send("Wrong token");
        
        } else {

          const rootUser = await User.findOne({ _id: verifyToken._id });
          console.log("rootUser", rootUser);

          if (!rootUser) {
            return res.status(401).send("User not found");
          }

          req.token = token;
          req.rootUser = rootUser;
          req.userId = rootUser._id;

          next();
        }
      });

    } else {
      return res.status(401).send("No token found in headers")
    }

  } catch (error) {
    res.status(400).send(error);
  }
} 

module.exports = authenticate;