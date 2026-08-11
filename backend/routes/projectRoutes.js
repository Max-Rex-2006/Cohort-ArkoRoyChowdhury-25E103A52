const express = require('express');
const router = express.Router();
const dp = require('../config/connection.js');
const { authenticateToken, requireProjectAdmin, requireProjectMember } = require('../middleware/authMiddleware.js');

// Get All Projects (Method: GET, Permission: User, Endpoint: /projects)
router.get('/', authenticateToken, async (req, res) => {
    // Extract user ID from the authenticated token
    const userID = req.user?.id;

    // Basic validation to check if user ID is available
    if (!userID) {
        return res.status(403).json({
            status: "error",
            message: "Session expired or invalid."
        });
    }

    try {
        // Query to fetch all details of all projects associated with the user ID
        const projectQuery = `SELECT p.id, p.name, p.description 
                            FROM projects p 
                            INNER JOIN project_members pm 
                                ON p.id = pm.project_id
                            WHERE pm.user_id = $1;`;
        const projectResult = await dp.query(projectQuery, [userID]);

        // Success Response
        res.status(200).json({
            status: "success",
            message: "Projects fetched successfully",
            data: projectResult.rows
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while fetching projects",
            error: error.message || error
        });
    }
});

// Create Project (Method: POST, Permission: User, Endpoint: /projects/create)
router.post('/create', authenticateToken, async (req, res) => {
    // Extract user ID from the authenticated token
    const userID = req.user?.id;

    // Basic validation to check if user ID is available
    if (!userID) {
        return res.status(403).json({
            status: "error",
            message: "Session expired or invalid."
        });
    }

    // Adds a new project to the database
    const { name, description } = req.body;

    // Basic validation to check if project name is provided
    if (!name) {
    return res.status(400).json({
        status: "error",
        message: "Project name is required."
    });
}

    //Create a new project and return the project details
    const createProjectQuery = `
        INSERT INTO projects (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING id, name, description;
    `;

    //Create the role admin for the user who created the project and return the role details
    const createRoleQuery = `
        INSERT INTO project_members (user_id, project_id, role)
        VALUES ($1, $2, $3)
        RETURNING project_id, role;
    `;

    // Create a client variable to hold the database connection
    let client;

    try {
        // Get a client from the pool
        const client = await dp.connect();

        //Begin a transaction to ensure both project creation and role assignment are atomic
        await client.query('BEGIN');

        // Execute the project creation query
        const projectresult = await client.query(createProjectQuery, [
            name,
            description,
            userID
        ]);
        // Extract the newly created project ID from the result
        const projectId = projectresult.rows[0].id;
        // Execute the role creation query to assign the user as an admin for the new project
        const roleresult = await client.query(createRoleQuery, [
            userID,
            projectId,
            'admin'
        ]);

        // Commit the transaction if both queries succeed
        await client.query('COMMIT');

        // Success response
        res.status(201).json({
            status: "Success",
            message: "Project created successfully",
            data: {
                project: projectresult.rows[0],
                role: roleresult.rows[0]
            }
        });
    } catch (error) {
        // Rollback the transaction if any query fails
        await client.query('ROLLBACK');

        res.status(500).json({
            status: "failure",
            message: "Project Cannot be created",
            error: error.message || error,
        });
    } finally {
        // Return the database connection back to the pool
        client.release();
    }
});

// Get All Project Tasks (Method: GET, Permission: Project member, Endpoint: /projects/:projectId/tasks)
router.get('/:projectId/tasks', authenticateToken, requireProjectMember, async (req, res) => {
    // Extract project ID from the request parameters
    const { projectId } = req.params  ;

    // Basic validation to check if project ID is available
    if (!projectId) {
        return res.status(400).json({
            status: "error",
            message: "Invalid project ID."
        });
    }

    // Query to fetch all tasks associated with the specified project ID
    const getTasksQuery = ` SELECT *
                            FROM tasks t
                            WHERE t.project_id = $1;`;

    try {
        // Execute the query to fetch tasks for the specified project ID
        const tasksResult = await dp.query(getTasksQuery, [projectId]);
        
        // Success response 
        res.status(200).json({
            status: "success",
            message: "Tasks fetched successfully",
            data: tasksResult.rows
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while fetching tasks",
            error: error.message || error
        });
    }
});

// Invite User to Project (Method: POST, Permission: Project Admin, Endpoint: /projects/:projectId/invite)
router.post('/:projectId/invite', authenticateToken, requireProjectAdmin, async (req, res) => {

    // Extract project ID from the URL
    const projectId = req.params.projectId;

    // Extract the user to be invited from the request body
    const { username } = req.body;

    // Basic validation
    if (!projectId || !username) {
        return res.status(400).json({
            status: "error",
            message: "Project ID and username are required."
        });
    }

    try {
        // Find the user who is being invited
        const findUserQuery = `
            SELECT id, username, email
            FROM users
            WHERE username = $1;
        `;

        const userResult = await dp.query(findUserQuery, [username]);

        // Check whether the user exists
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User to invite not found."
            });
        }

        const invitedUser = userResult.rows[0];

        // Check whether the user is already a member of this project
        const checkMembershipQuery = `
            SELECT user_id
            FROM project_members
            WHERE user_id = $1
              AND project_id = $2;
        `;

        const membershipResult = await dp.query(checkMembershipQuery, [
            invitedUser.id,
            projectId
        ]);

        if (membershipResult.rows.length > 0) {
            return res.status(409).json({
                status: "error",
                message: "User is already a member of this project."
            });
        }

        // Add the user to the project as a regular member
        const inviteQuery = `
            INSERT INTO project_members (user_id, project_id, role)
            VALUES ($1, $2, $3)
            RETURNING project_id, role;
        `;

        const inviteResult = await dp.query(inviteQuery, [
            invitedUser.id,
            projectId,
            'member'
        ]);

        // Success response
        res.status(201).json({
            status: "success",
            message: "User invited successfully.",
            data: inviteResult.rows[0]
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while inviting the user.",
            error: error.message || error
        });
    }
});

// Get All Project Members (Method: GET, Permission: Project member, Endpoint: /projects/:projectId/members)
router.get('/:projectId/members', authenticateToken, requireProjectMember, async (req, res) => {
    // Extract project ID from the request parameters
    const { projectId } = req.params  ;

    // Basic validation to check if project ID is available
    if (!projectId) {
        return res.status(400).json({
            status: "error",
            message: "Invalid project ID."
        });
    }

    try {
        // Fetch all members of the project
        const query = `
            SELECT u.username, u.email, pm.role
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1;
        `;

        const result = await dp.query(query, [projectId]);

        res.status(200).json({
            status: "success",
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while fetching project members.",
            error: error.message || error
        });
    }
});

module.exports = router;