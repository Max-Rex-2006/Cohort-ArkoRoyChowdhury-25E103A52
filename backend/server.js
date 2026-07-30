const express = require('express');
const app = express();
require('dotenv').config();
const {initDatabase} = require('./controllers/initDb.js');
const dp = require('./models/connection.js');


initDatabase();

PORT = process.env.PORT;

app.use(express.urlencoded({extended: false}));
app.use(express.json());




// 1. Verify Connection (Method: GET, Endpoint: /)
app.get('/', (req, res) => {
    //Verifies the successful connection to the server and returns a welcome message
  res.status(200).json({
    status: "success",
    message: "Welcome to Home Page"
  })
});

// 2. Fetch Users (Method: GET, Endpoint: /users)
app.get('/users', async (req, res) => {
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

// 3. Create User (Method: POST, Endpoint: /user)
app.post('/user', async (req, res) => {
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

// 4. Verify Login (Method: POST, Endpoint: /login)
app.post('/login', async (req, res) => {
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

        // Check if the incoming password matches the database password
        if (user.password !== password) {
            return res.status(401).json({
                status: "error",
                message: "Invalid credentials"
            });
        }

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

// 5. Update Profile (Method: PATCH, Endpoint: /profile)
app.patch('/profile', async (req, res) => {
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

// 6. Delete Profile (Method: DELETE, Endpoint: /profile)
app.delete('/profile', async (req, res) => {
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


app.listen(process.env.PORT, (err) => {
  if(err) console.log(err);

      console.log(`Server is running on port ${PORT}`);
})