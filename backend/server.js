const express = require('express');
const app = express();
require('dotenv').config();
const {initDatabase} = require('./controllers/initDb.js');
const dp = require('./models/connection.js');


initDatabase();

PORT = process.env.PORT;

app.use(express.urlencoded({extended: false}));
app.use(express.json());


  
app.listen(process.env.PORT, (err) => {
  if(err) console.log(err);

      console.log(`Server is running on port ${PORT}`);
})