const express = require('express');
const router = express.Router();
const dp = require('../config/connection.js');
const bcrypt = require('bcrypt');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware.js');

// Fetch Users (Method: GET, Permission: Admin, Endpoint: /users)
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

// Get profile (Method: GET, Permission: User, Endpoint: /users/profile)
router.get('/profile', authenticateToken, requireAdmin, async (req, res) => {
    // Extract user ID from the authenticated token
    const userID = req.user?.id; 

    // Validate that user ID is provided
    if (!userID) {
        return res.status(400).json({
            status: "error",
            message: "User ID is required"
        });
    }

    const checkDetailsQuery = `
        SELECT id, username, member_id, email, age
        FROM users
        WHERE id = $1;
    `;

    try {
        const result = await dp.query(checkDetailsQuery, [userID]);
    
        // Check if the user exists in the database
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }
    
        const user = result.rows[0];

        // Success response 
        res.status(200).json({
            status: "success",
            message: "Profile retrieved successfully",
            data: user
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred during profile check",
            error: error.message || error
        });
    }
});

// Update Profile (Method: PATCH, Permission: User, Endpoint: /users/profile)
router.patch('/profile', authenticateToken, async (req, res) => {
    // Extract credentials for verification + allowed fields for modification
    const { currentPassword, email, password, age } = req.body;

    // Extract user ID from the authenticated token
    const userID = req.user?.id; 

    // Check if verification credentials are provided
    if (!userID || !currentPassword) {
        return res.status(400).json({
            status: "error",
            message: "Verification credential (currentPassword) is required."
        });
    }

    try {
        // Check if email exist and match a user in the database
        const verifyQuery = `SELECT id, email, password_hash, age 
                            FROM users 
                            WHERE id = $1`;
        const verifyResult = await dp.query(verifyQuery, [userID]);

        if (verifyResult.rows.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials. Profile modification unauthorized."
            });
        }

        //Fetch the matched user details from the database for further updates
        const currentUser = verifyResult.rows[0];

        // Compare the provided password with the stored hashed password
        const match = await bcrypt.compare(currentPassword, currentUser.password_hash);

        if (!match) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials. Profile modification unauthorized."
            });
        }

        // Only allow email, password, age modifications (Fallback to current database values if omitted)
        const updatedEmail = email !== undefined ? email : currentUser.email;
        const updatedPassword = password !== undefined ? await bcrypt.hash(password, 10) : currentUser.password_hash;
        const updatedAge = age !== undefined ? age : currentUser.age;

        // Execute the PATCH Update Query using safe parameterized inputs
        const updateQuery = `
            UPDATE users 
            SET email = $1, password_hash = $2, age = $3 
            WHERE id = $4
            RETURNING username, member_id, email, age;
        `;

        const updateResult = await dp.query(updateQuery, [
            updatedEmail, 
            updatedPassword, 
            updatedAge, 
            currentUser.id
        ]);

        // Success Response
        res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            data: updateResult.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Profile update failed",
            error: error.message || error
        });
    }
});

// Delete Profile (Method: DELETE, Permission: User, Endpoint: /users/profile)
router.delete('/profile', authenticateToken, async (req, res) => {
    // Extract password from request body for identity verification
    const { password } = req.body;

    // Extract user ID from the authenticated token
    const userID = req.user?.id;

    // Basic validation to check if fields are provided
    if (!userID || !password) {
        return res.status(400).json({
            status: "error",
            message: "Password is required to delete your account."
        });
    }

    try {
        // Query to verify if the user exists and credentials match
        const verifyQuery = `SELECT id, password_hash 
                            FROM users 
                            WHERE id = $1;`;
        const verifyResult = await dp.query(verifyQuery, [userID]);

        // If user is not found
        if (verifyResult.rows.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials. Account deletion unauthorized."
            });
        }

        const user = verifyResult.rows[0];

        // Compare the provided password with the stored hashed password
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials. Account deletion unauthorized."
            });
        }

        // Execute the DELETE query for that specific user ID
        const deleteQuery = `
            DELETE FROM users 
            WHERE id = $1;`;
        
        await dp.query(deleteQuery, [user.id]);

        // Success Response
        res.status(200).json({
            status: "success",
            message: "Account deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while deleting the profile",
            error: error.message || error
        });
    }
});

module.exports = router;