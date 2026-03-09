/**
 * Contrôleur des leçons
 * =====================
 */

const { validationResult } = require('express-validator');
const Lesson = require('../models/lesson.model');
const { asyncHandler, ValidationError, NotFoundError, BadRequestError } = require('../middlewares/error.middleware');

/**
 * Récupère toutes les leçons
 * GET /api/lessons
 */
const getAllLessons = asyncHandler(async (req, res) => {
  const { category, difficulty, page = 1, limit = 50 } = req.query;

  const result = await Lesson.findAll({
    category,
    difficulty,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Récupère une leçon par slug
 * GET /api/lessons/:slug
 */
const getLessonBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const lesson = await Lesson.findBySlug(slug);

  if (!lesson) {
    throw new NotFoundError('Leçon non trouvée');
  }

  // Si l'utilisateur est authentifié, enregistrer la progression
  if (req.user) {
    await Lesson.saveProgress(req.user.id, lesson.id, {
      time_spent_seconds: 0,
    });
  }

  res.status(200).json({
    success: true,
    data: lesson.toJSON(),
  });
});

/**
 * Récupère les leçons par catégorie
 * GET /api/lessons/category/:category
 */
const getLessonsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const lessons = await Lesson.findByCategory(category);

  res.status(200).json({
    success: true,
    data: lessons.map((l) => l.toJSON()),
  });
});

/**
 * Récupère les catégories de leçons
 * GET /api/lessons/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Lesson.getCategories();

  res.status(200).json({
    success: true,
    data: categories,
  });
});

/**
 * Enregistre le progrès sur une leçon
 * POST /api/lessons/:slug/progress
 */
const saveProgress = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { completed, time_spent_seconds } = req.body;
  const userId = req.user.id;

  const lesson = await Lesson.findBySlug(slug);

  if (!lesson) {
    throw new NotFoundError('Leçon non trouvée');
  }

  const progress = await Lesson.saveProgress(userId, lesson.id, {
    completed,
    time_spent_seconds,
  });

  res.status(200).json({
    success: true,
    message: 'Progrès enregistré',
    data: progress,
  });
});

/**
 * Récupère le progrès de l'utilisateur
 * GET /api/lessons/progress
 */
const getUserProgress = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const progress = await Lesson.getUserProgress(userId);

  res.status(200).json({
    success: true,
    data: progress,
  });
});

/**
 * Crée une nouvelle leçon (admin uniquement)
 * POST /api/lessons
 */
const createLesson = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Données invalides', errors.array());
  }

  const lessonData = req.body;
  const lesson = await Lesson.create(lessonData);

  res.status(201).json({
    success: true,
    message: 'Leçon créée',
    data: lesson.toJSON(),
  });
});

/**
 * Met à jour une leçon (admin uniquement)
 * PUT /api/lessons/:id
 */
const updateLesson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const lesson = await Lesson.update(id, updates);

  res.status(200).json({
    success: true,
    message: 'Leçon mise à jour',
    data: lesson.toJSON(),
  });
});

/**
 * Supprime une leçon (admin uniquement)
 * DELETE /api/lessons/:id
 */
const deleteLesson = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Lesson.delete(id);

  res.status(200).json({
    success: true,
    message: 'Leçon supprimée',
  });
});

module.exports = {
  getAllLessons,
  getLessonBySlug,
  getLessonsByCategory,
  getCategories,
  saveProgress,
  getUserProgress,
  createLesson,
  updateLesson,
  deleteLesson,
};