/**
 * Index des routes API
 * ====================
 */

const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./routes/auth.routes');
const marketRoutes = require('./routes/market.routes');
const smcRoutes = require('./routes/smc.routes');
const lessonsRoutes = require('./routes/lessons.routes');

// Montage des routes
router.use('/auth', authRoutes);
router.use('/market', marketRoutes);
router.use('/smc', smcRoutes);
router.use('/lessons', lessonsRoutes);

module.exports = router;