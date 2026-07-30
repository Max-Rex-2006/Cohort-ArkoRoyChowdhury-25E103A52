const express = require('express');
const app = express();
require('dotenv').config();
const {initDatabase} = require('./controllers/initDb.js');
const dp = require('./models/connection.js');


initDatabase();

PORT = process.env.PORT;

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get('/', (req, res) => {
    //Verifies the successful connection to the server and returns a welcome message
  res.status(200).json({
    status: "success",
    message: "Welcome to home page"
  })
});


app.get('/users', async (req, res) => {
    //Fetches all users and their info
  const checkColumnsQuery = `
    SELECT *  
    FROM users;
  `;
  
  try {
    const result = await dp.query(checkColumnsQuery);
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


app.post('/user', async (req, res) => {
    // Adds a new user to the database
    const { id, username, email, password } = req.body;

    const createUserQuery = `
        INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, username, email;
    `;
    try {
        const result = await dp.query(createUserQuery, [
            username, email, password
        ]);
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


app.post('/login', async (req, res) => {
    // Fetches a user based on the provided username and password for login
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

        // Success response containing matching hand-written formatting
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
  
app.listen(process.env.PORT, (err) => {
  if(err) console.log(err);

      console.log(`Server is running on port ${PORT}`);
})