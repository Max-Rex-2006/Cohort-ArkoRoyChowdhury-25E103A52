const express = require('express');
const app = express();
require('dotenv').config();

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Import the initDatabases function from initDb.js
const {initDatabases} = require('./config/database.js');
// Initialize all databases before starting the server
try {
  await initDatabases();
  console.log("✅ All databases initialized successfully");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
  process.exit(1);
}

const PORT = process.env.PORT;

app.use(express.urlencoded({extended: false}));
app.use(express.json());


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




// Connecting to the port and starting the server
app.listen(process.env.PORT, (err) => {
  if(err) console.log(err);

      console.log(`Server is running on port ${PORT}`);
});