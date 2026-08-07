const express = require('express');
const router = express.Router();
const dp = require('../models/connection.js');

// Create User (Method: POST, Permission: Public, Endpoint: /register)
router.post('/register', async (req, res) => {
    // Adds a new user to the database
    const { id, name, registration_no, email, password, age } = req.body;

    const createUserQuery = `
        INSERT INTO users (name, registration_no, email, password, age)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, registration_no, email, age;
    `;
    try {
        const result = await dp.query(createUserQuery, [
            name, registration_no, email, password, age
        ]);

        // Success response 
        res.status(201).json({
            status: "Success",
            message: "User created successfully",
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: "User Cannot be created",
            error: error
        });
    }
});

// Verify Login (Method: POST, Permission: Public, Endpoint: /login)
router.post('/login', async (req, res) => {
    // Fetches a user based on the provided name and password for login
    const { name, password } = req.body;

    // Validate that both username and password are provided
    if (!name || !password) {
        return res.status(400).json({
            status: "error",
            message: "Username and password are required"
        });
    }

    // Query to find the user by their unique combination of username and password
    const loginQuery = `
        SELECT id, name, registration_no, email, password, age 
        FROM users 
        WHERE name = $1 AND password = $2;
    `;

    try {
        const result = await dp.query(loginQuery, [name, password]);

        // Check if the user exists in the database
        if (result.rows.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials"
            });
        }

        const user = result.rows[0];

        // Remove the password property before sending user details back for security
        delete user.password;

        // Success response 
        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: user
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred during login",
            error: error.message || error
        });
    }
});

module.exports = router;
