// Libraries
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const port = process.env.PORT || 8000;

// Express
const app = express();

// Database connection
require('./database/connection');

// Routes
const router = require('./routes/router');

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());
app.use('/api', router);

// Server
app.listen(port, function() {
  console.log("Server started at port " + port);
})
