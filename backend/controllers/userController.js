const dp = require('../config/connection.js');

const getprofile = async (req, res) => {
    // Extract user ID from the authenticated token
    const userID = req.user?.id;

    // Validate that user ID is provided
    if (!userID) {
        return res.status(400).json({
            status: "error",
            message: "User ID is required"
        });
    }

    const checkDetailsQuery = `
            SELECT id, username, member_id, email, age
            FROM users
            WHERE id = $1;
        `;

    try {
        const result = await dp.query(checkDetailsQuery, [userID]);

        // Check if the user exists in the database
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        const user = result.rows[0];

        // Success response 
        res.status(200).json({
            status: "success",
            message: "Profile retrieved successfully",
            data: user
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred during profile check",
            error: error.message || error
        });
    }
};

module.exports = {
    getprofile
};