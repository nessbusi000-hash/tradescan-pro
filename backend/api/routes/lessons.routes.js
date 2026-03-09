/**
 * Routes des leçons
 * =================
 */

const express = require('express');
const { body } = require('express-validator');
const lessonsController = require('../../controllers/lessons.controller');
const { authenticate, requireAdmin } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Validation pour la création/mise à jour de leçon
const lessonValidation = [
  body('slug')
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug invalide (lettres minuscules, chiffres et tirets uniquement)'),
  body('title')
    .isString()
    .isLength({ min: 3, max: 200 })
    .withMessage('Titre invalide'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 }),
  body('content')
    .isString()
    .isLength({ min: 10 })
    .withMessage('Contenu requis'),
  body('category')
    .isString()
    .isLength({ min: 2, max: 50 }),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']),
  body('order_index')
    .optional()
    .isInt({ min: 0 }),
  body('duration_minutes')
    .optional()
    .isInt({ min: 1 }),
  body('tags')
    .optional()
    .isArray(),
];

// Validation pour la progression
const progressValidation = [
  body('completed')
    .optional()
    .isBoolean(),
  body('time_spent_seconds')
    .optional()
    .isInt({ min: 0 }),
];

// Routes publiques
router.get('/', lessonsController.getAllLessons);
router.get('/categories', lessonsController.getCategories);
router.get('/category/:category', lessonsController.getLessonsByCategory);
router.get('/:slug', lessonsController.getLessonBySlug);

// Routes protégées (utilisateur connecté)
router.post('/:slug/progress', authenticate, progressValidation, lessonsController.saveProgress);
router.get('/user/progress', authenticate, lessonsController.getUserProgress);

// Routes admin
router.post('/', authenticate, requireAdmin, lessonValidation, lessonsController.createLesson);
router.put('/:id', authenticate, requireAdmin, lessonValidation, lessonsController.updateLesson);
router.delete('/:id', authenticate, requireAdmin, lessonsController.deleteLesson);

module.exports = router;