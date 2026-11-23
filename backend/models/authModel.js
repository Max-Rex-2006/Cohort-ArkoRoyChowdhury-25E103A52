const dp = require("../config/connection.js");

// ============================================================
// CREATE USER
// ============================================================

const createUser = async (username, email, hashedPassword, age) => {
    const registerQuery = `
        INSERT INTO users (username, email, password_hash, age)
        VALUES ($1, $2, $3, $4)
        RETURNING username, member_id, email, age;
    `;

    const result = await dp.query(registerQuery, [
        username,
        email,
        hashedPassword,
        age,
    ]);

    return result.rows[0];
};

// ============================================================
// FIND USER BY USERNAME
// ============================================================

const findUserByUsername = async (username) => {

    const loginQuery = `
        SELECT id, username, member_id, email, password_hash, age, role
        FROM users 
        WHERE username = $1;
    `;

    const result = await dp.query(loginQuery, [username]);
    return result.rows[0];
};

// ============================================================
// EXPORT MODEL FUNCTIONS
// ============================================================

module.exports = {
    createUser,
    findUserByUsername
};