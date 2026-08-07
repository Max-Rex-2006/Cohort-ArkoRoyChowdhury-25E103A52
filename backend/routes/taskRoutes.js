const express = require('express');
const router = express.Router();
const dp = require('../models/connection.js');

//Creates a new task (Permission: Project member, Method: POST, Endpoint: /tasks/create)
router.post('/create', async (req, res) => {
    
});

//Updates an existing task (Permission: Project member, Method: PUT, Endpoint: /tasks/:taskID)
router.put('/:taskID', async (req, res) => {
    
});

module.exports = router;