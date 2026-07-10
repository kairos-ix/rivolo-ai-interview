const User = require('../models/User');

/**
 * @desc    Get all users (with optional filtering)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -previousPasswords')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

/**
 * @desc    Update a user's role and/or permissions
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const { role, permissions } = req.body;
    
    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot change your own role.' });
    }
    
    // Validate role if provided
    const validRoles = ['student', 'mentor', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (permissions && Array.isArray(permissions)) updateData.permissions = permissions;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

/**
 * @desc    Get platform metrics (basic overview)
 * @route   GET /api/admin/metrics
 * @access  Private/Admin
 */
const getMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentsCount = await User.countDocuments({ role: 'student' });
    const mentorsCount = await User.countDocuments({ role: 'mentor' });
    const adminsCount = await User.countDocuments({ role: 'admin' });

    res.json({
      users: {
        total: totalUsers,
        students: studentsCount,
        mentors: mentorsCount,
        admins: adminsCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching metrics', error: error.message });
  }
};

/**
 * @desc    Restrict or unrestrict a user account
 * @route   PUT /api/admin/users/:id/restrict
 * @access  Private/Admin
 */
const toggleRestriction = async (req, res) => {
  try {
    const { restricted, reason } = req.body;

    // Prevent admin from restricting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot restrict your own account.' });
    }

    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent restricting other admins
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot restrict another admin account.' });
    }

    targetUser.isRestricted = restricted;
    targetUser.restrictedAt = restricted ? new Date() : null;
    targetUser.restrictedReason = restricted ? (reason || 'Restricted by administrator') : null;
    await targetUser.save();

    res.json({ 
      message: restricted ? 'User account restricted successfully' : 'User account unrestricted successfully',
      user: targetUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating restriction', error: error.message });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  getMetrics,
  toggleRestriction
};
