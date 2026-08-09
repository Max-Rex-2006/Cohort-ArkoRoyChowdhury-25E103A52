const { query } = require("./connection.js");

// function to initialize database extensions
const initExtensions = async () => {
  const createExtensionQuery = `CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
  try {
    await query(createExtensionQuery);
    console.log("pgcrypto extension initialized successfully");
  } catch (error) {
    console.error("Failed to initialize pgcrypto extension:", error);
    process.exit(1);
  }
};

// function to initialize the user database
const initUserDatabase = async () => {
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      username VARCHAR(100) UNIQUE NOT NULL
        CHECK(char_length(username)>=3),

      member_id VARCHAR(7) UNIQUE NOT NULL,
      
      email VARCHAR(255) UNIQUE NOT NULL,
      
      password_hash VARCHAR(255) NOT NULL,
      
      age INTEGER
        CHECK (age >= 16 AND age <= 65),
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createFunctionQuery = `
    CREATE OR REPLACE FUNCTION generate_member_id()
    RETURNS VARCHAR(7) AS $$
    DECLARE
      year_part VARCHAR(2);
      month_letter CHAR(1);
      serial_num INTEGER;
    BEGIN
      -- Get last 2 digits of current year
      year_part := TO_CHAR(CURRENT_DATE, 'YY');
      
      -- Get month letter (A=Jan, B=Feb, ..., L=Dec)
      month_letter := CHR(64 + EXTRACT(MONTH FROM CURRENT_DATE));
      
      -- Get 4-digit serial that resets monthly
      serial_num := (SELECT COALESCE(MAX(CAST(SUBSTRING(member_id, 4, 4) AS INTEGER)), 0) + 1
                     FROM users
                     WHERE member_id LIKE year_part || month_letter || '%');
                     --AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE));
      
      -- Ensure serial is 4 digits (pad with zeros if needed)
      RETURN year_part || month_letter || LPAD(serial_num::TEXT, 4, '0');
    END;
    $$ LANGUAGE plpgsql;
  `;

  const addDefaultQuery = `
    ALTER TABLE users ALTER COLUMN member_id SET DEFAULT generate_member_id();
  `;

  try {
    // Create the table 
    await query(createTableQuery);
    console.log("Table created successfully");
    
    // Create the function
    await query(createFunctionQuery);
    console.log("Function created successfully");
    
    // Add the default
    await query(addDefaultQuery);
    console.log("Default value added to member_id");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

// function to initialize the project database
const initProjectDatabase = async () => {
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      name VARCHAR(255) NOT NULL,
      
      description TEXT,
      
      owner_id UUID NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

// function to initialize the task database
const initTaskDatabase = async () => {
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      title VARCHAR(255) NOT NULL,
      
      description TEXT,

      status VARCHAR(255) NOT NULL DEFAULT 'To Do'
        CHECK(status IN ('To Do','In Progress','Done')),
      
      project_id UUID NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

      created_by UUID NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      
      assigned_to UUID,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

// function to initialize the project_members database
const initProjectMembersDatabase = async () => {

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS project_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      project_id UUID NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      
      user_id UUID NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      
      role VARCHAR(50) NOT NULL,
        CHECK(role IN ('admin', 'member')),
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(project_id, user_id)
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

//function to initialize all databases
const initDatabases = async () => {
  await initExtensions(); // Ensure extensions are initialized before creating tables
  await initUserDatabase(); // Initialize the user database
  await initProjectDatabase(); // Initialize the project database
  await initTaskDatabase(); // Initialize the task database
  await initProjectMembersDatabase(); // Initialize the project_members database
};

module.exports = {initDatabases};