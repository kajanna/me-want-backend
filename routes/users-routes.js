const express = require('express');
const { check } = require('express-validator');

const usersControlers = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', usersControlers.getAllUsers);
router.get('/:uid', usersControlers.getUserById);
router.post(
    '/signup',
    fileUpload.single('image'),
    [
       check('name').not().isEmpty(),
       check('email').normalizeEmail().isEmail(),
       check('password').isLength({min: 8})
    ], 
    usersControlers.createNewUser);
router.post('/login', usersControlers.loginUser);

module.exports = router;