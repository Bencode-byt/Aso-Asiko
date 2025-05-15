const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

// Only admin can access these routes
router.use(verifyToken, authorizeRoles('admin'));

router.post('/create-user', adminController.createUser);
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
