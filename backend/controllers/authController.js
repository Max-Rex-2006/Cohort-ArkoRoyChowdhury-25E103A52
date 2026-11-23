const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authModel = require("../models/authModel.js");


// ============================================================
// REGISTER USER
// ============================================================

// Create User (Method: POST, Permission: Public, Endpoint: /register)
const registerUser = async (req, res) => {
// Adds a new user to the database
    const { username, email, password, age } = req.body;

    try {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);
        // Execute Database query
        const result = await authModel.createUser(
            username,
            email,
            hashedPassword,
            age
        );

        // Success response
        res.status(201).json({
            status: "Success",
            message: "User created successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: "User Cannot be created",
            error: error.message || error
        });
    }
};

// ============================================================
// LOGIN USER
// ============================================================

// Verify Login (Method: POST, Permission: Public, Endpoint: /login)
const loginUser = async (req, res) => {
    // Fetches a user based on the provided username and password for login
    const { username, password } = req.body;

    // Validate that both username and password are provided
    if (!username || !password) {
        return res.status(400).json({
            status: "error",
            message: "Username and password are required",
        });
    }

    try {
        // Fetch user details through the Model
        const user = await authModel.findUserByUsername(username);

        // Check if the user exists
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials",
            });
        }

        // Compare the provided password with the stored hashed password
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials",
            });
        }

        // Generate JWT after successful password verification
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                member_id: user.member_id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1h",
            },
        );

        // Store JWT inside an HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
        });

        // Remove the password_hash property before sending user details back for security
        delete user.password_hash;

        // Success response
        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred during login",
            error: error.message || error,
        });
    }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    registerUser,
    loginUser
};