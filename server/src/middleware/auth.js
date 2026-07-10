const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Hash token for lookup
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // 1. Check if session is revoked
    const session = await Session.findOne({ tokenHash });
    if (!session || session.isRevoked) {
      return res.status(401).json({ message: 'Session expired or revoked. Please log in again.' });
    }

    // 2. Check if user still exists and if password was changed after token issuance
    const user = await User.findById(decoded.userId).select('passwordChangedAt');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    
    // Convert JWT iat to ms. If password changed after token was issued, token is invalid
    if (user.passwordChangedAt && decoded.iat) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (changedTimestamp > decoded.iat) {
        return res.status(401).json({ message: 'Password recently changed. Please log in again.' });
      }
    }

    // Update session last active time (non-blocking)
    Session.updateOne({ _id: session._id }, { lastActiveAt: Date.now() }).exec();

    req.userId = decoded.userId;
    req.sessionId = session._id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { protect };