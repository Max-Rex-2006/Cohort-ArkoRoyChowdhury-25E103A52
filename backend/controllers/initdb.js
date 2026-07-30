const { query } = require("../models/connection.js");

const initDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL,
      
      name VARCHAR(100) NOT NULL,
      
      registration_no VARCHAR(10) UNIQUE NOT NULL
        CHECK (char_length(registration_no) = 10),
      
      email VARCHAR(255) UNIQUE NOT NULL,
      
      password VARCHAR(255) NOT NULL
        CHECK (char_length(password) >= 8),
      
      age INTEGER NOT NULL
        CHECK (age >= 16 AND age <= 65),

      PRIMARY KEY (id, registration_no)
    );
  `;

  try {
    await query(createTableQuery);
    console.log("Table created successfully");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = {
  initDatabase,
};