const express = require('express');
const router = express.Router();
const dp = require('../config/connection.js');

//Creates a new task (Permission: Project member, Method: POST, Endpoint: /tasks/create)
router.post('/create', async (req, res) => {
    // Extract project ID from the request parameters
    const { projectId } = req.params;

    // Basic validation to check if project ID is available
    if (!projectId) {
        return res.status(400).json({
            status: "error",
            message: "Invalid project ID."
        });
    }

    const { title, description } = req.body;

    // Query to create a new task associated with the specified project ID
    const createTaskQuery = ` INSERT INTO tasks (title, description, project_id)
                              VALUES ($1, $2, $3)
                              RETURNING *;`;

    try {
        // Execute the query to create the new task
        const tasksResult = await dp.query(createTaskQuery, [title, description, projectId]);

        // Success response 
        res.status(200).json({
            status: "success",
            message: "Task created successfully",
            data: tasksResult.rows
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while creating the task",
            error: error.message || error
        });
    }
});

//Updates an existing task (Permission: Project member, Method: PUT, Endpoint: /tasks/:taskID)
router.put('/:taskID', async (req, res) => {
    const { taskID } = req.params;

    // Basic validation to check if task ID is available
    if (!taskID) {
        return res.status(400).json({
            status: "error",
            message: "Invalid task ID."
        });
    }

    const { title, description } = req.body;

    // Query to update the existing task
    const updateTaskQuery = ` UPDATE tasks
                              SET title = $1, description = $2
                              WHERE id = $3
                              RETURNING *;`;

    try {
        // Execute the query to update the task
        const tasksResult = await dp.query(updateTaskQuery, [title, description, taskID]);

        // Check if the task was found and updated
        if (tasksResult.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Task not found."
            });
        }

        // Success response
        res.status(200).json({
            status: "success",
            message: "Task updated successfully",
            data: tasksResult.rows
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An error occurred while updating the task",
            error: error.message || error
        });
    }
});

module.exports = router;