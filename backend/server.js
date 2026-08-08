require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Defining the Express application
const app = express();

// Check if PORT is defined in the environment variables
const PORT = process.env.PORT;
if(!PORT){
    console.error("PORT missing in .env");
    process.exit(1);
}

// Import the initDatabases function from database.js
const {initDatabases} = require('./config/database.js');


// Connections:

// Enable CORS Middleware for requests from http://localhost:5173
app.use(cors({
  origin: 'http://localhost:5173'
}));
// Checks and parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.json());
// Checks and parses incoming requests with URL-encoded payloads and is based on body-parser.
app.use(express.urlencoded({extended: false}));


// Routes:

// Verify Connection (Method: GET, Endpoint: /)
app.get('/', (req, res) => {
    //Verifies the successful connection to the server and returns a welcome message
  res.status(200).json({
    status: "success",
    message: "Welcome to Home Page"
  })
});


const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const projectRoutes = require('./routes/projectRoutes');
app.use('/api/projects', projectRoutes);

const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

const userRoutes = require('./routes/userRoutes.js');
app.use('/api/users', userRoutes);



// Initialize all databases before starting the server
const startServer = async () => {
  try {
    await initDatabases();
    console.log("✅ Databases ready");
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
};

// Connecting to the port and starting the server after initializing the databases
startServer();