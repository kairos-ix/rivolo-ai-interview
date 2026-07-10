const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { getUsers, updateUserRole, getMetrics, toggleRestriction } = require('../controllers/adminController');

// All admin routes require authentication and the 'admin' role
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/restrict', toggleRestriction);
router.get('/metrics', getMetrics);

module.exports = router;
