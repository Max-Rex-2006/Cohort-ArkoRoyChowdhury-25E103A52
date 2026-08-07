const express = require('express');
const router = express.Router();
const dp = require('../models/connection.js');

// Fetch Users (Method: GET, Endpoint: /users)
router.get('/', async (req, res) => {
    //Fetches all users and their info
  const checkColumnsQuery = `
    SELECT *  
    FROM users;
  `;
  
  try {
    const result = await dp.query(checkColumnsQuery);

    // Success response 
    res.status(200).json({
      status: "success",
      message: "Actual database column names:",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Could not fetch table metadata",
      error: error.message || error
    });
  }
});

router.get('/profile', async (req, res) => {});

module.exports = router;