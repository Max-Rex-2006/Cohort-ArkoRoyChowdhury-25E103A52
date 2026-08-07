const express = require('express');
const router = express.Router();
const dp = require('../models/connection.js');

// Get All Projects (Method: GET, Permission: User, Endpoint: /projects)
router.get('/', async (req, res) => {

});

// Create Project (Method: POST, Permission: User, Endpoint: /projects/create)
router.post('/create', async (req, res) => {

});


// Get All Project Tasks (Method: GET, Permission: Project member, Endpoint: /projects/:id/tasks)
router.get('/:id/tasks', async (req, res) => {

});

// Invite User to Project (Method: POST, Permission: Project Admin, Endpoint: /projects/:id/invite)
router.post('/:id/invite', async (req, res) => {

});

// Get All Project Members (Method: GET, Permission: Project member, Endpoint: /projects/:id/members)
router.get('/:id/members', async (req, res) => {

});

module.exports = router;