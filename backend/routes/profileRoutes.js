const express = require('express');
const router = express.Router();
const dp = require('../models/connection.js');

// Update Profile (Method: PATCH, Endpoint: /profile)
router.patch('/', async (req, res) => {
    // 1. Extract credentials for verification + allowed fields for modification
    const { currentEmail, currentPassword, email, password, age } = req.body;

    // Check if verification credentials are provided
    if (!currentEmail || !currentPassword) {
        return res.status(400).json({
            status: "error",
            message: "Verification credentials (currentEmail and currentPassword) are required."
        });
    }

    try {
        // Check if email & password exist and match a user in the database
        const verifyQuery = `SELECT * FROM users WHERE email = $1 AND password = $2;`;
        const verifyResult = await dp.query(verifyQuery, [currentEmail, currentPassword]);

        if (verifyResult.rows.length === 0 || verifyResult.rows[0].password !== currentPassword) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials. Profile modification unauthorized."
            });
        }

        //Fetch the matched user details from the database for further updates
        const currentUser = verifyResult.rows[0];

        // Only allow email, password, age modifications (Fallback to current database values if omitted)
        const updatedEmail = email !== undefined ? email : currentUser.email;
        const updatedPassword = password !== undefined ? password : currentUser.password;
        const updatedAge = age !== undefined ? age : currentUser.age;

        // Execute the PATCH Update Query using safe parameterized inputs
        const updateQuery = `
            UPDATE users 
            SET email = $1, password = $2, age = $3 
            WHERE id = $4
            RETURNING id, name, registration_no, email, age;
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

//Delete Profile (Method: DELETE, Endpoint: /profile)
router.delete('/', async (req, res) => {
    // Extract email and password from request body for identity verification
    const { email, password } = req.body;

    // Basic validation to check if fields are provided
    if (!email || !password) {
        return res.status(400).json({
            status: "error",
            message: "Email and password are required to delete your account."
        });
    }

    try {
        // Query to verify if the user exists and credentials match
        const verifyQuery = `SELECT id, password FROM users WHERE email = $1 AND password = $2;`;
        const verifyResult = await dp.query(verifyQuery, [email, password]);

        // If user is not found
        if (verifyResult.rows.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials. Account deletion unauthorized."
            });
        }

        const user = verifyResult.rows[0];

        // If password does not match
        if (user.password !== password) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials. Account deletion unauthorized."
            });
        }

        // Execute the DELETE query for that specific user ID
        const deleteQuery = `
            DELETE FROM users 
            WHERE id = $1;
        `;
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