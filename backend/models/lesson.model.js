/**
 * Modèle Lesson
 * =============
 * Gère les leçons et le progrès des utilisateurs
 */

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class Lesson {
  constructor(data) {
    this.id = data.id;
    this.slug = data.slug;
    this.title = data.title;
    this.description = data.description;
    this.content = data.content;
    this.category = data.category;
    this.difficulty = data.difficulty; // 'beginner', 'intermediate', 'advanced'
    this.order_index = data.order_index;
    this.duration_minutes = data.duration_minutes;
    this.tags = data.tags || [];
    this.is_published = data.is_published ?? true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Crée une nouvelle leçon
   * @param {Object} lessonData - Données de la leçon
   * @returns {Promise<Lesson>} Leçon créée
   */
  static async create(lessonData) {
    const {
      slug,
      title,
      description,
      content,
      category,
      difficulty = 'beginner',
      order_index = 0,
      duration_minutes = 10,
      tags = [],
    } = lessonData;

    const id = uuidv4();
    const sql = `
      INSERT INTO lessons (
        id, slug, title, description, content, category, difficulty,
        order_index, duration_minutes, tags, is_published, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      slug,
      title,
      description,
      content,
      category,
      difficulty,
      order_index,
      duration_minutes,
      JSON.stringify(tags),
      true,
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Leçon créée: ${title}`);
      return new Lesson(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Une leçon avec ce slug existe déjà');
      }
      throw error;
    }
  }

  /**
   * Trouve une leçon par ID
   * @param {string} id - ID de la leçon
   * @returns {Promise<Lesson|null>} Leçon trouvée ou null
   */
  static async findById(id) {
    const sql = 'SELECT * FROM lessons WHERE id = $1 AND is_published = true';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return new Lesson(result.rows[0]);
  }

  /**
   * Trouve une leçon par slug
   * @param {string} slug - Slug de la leçon
   * @returns {Promise<Lesson|null>} Leçon trouvée ou null
   */
  static async findBySlug(slug) {
    const sql = 'SELECT * FROM lessons WHERE slug = $1 AND is_published = true';
    const result = await query(sql, [slug]);

    if (result.rows.length === 0) {
      return null;
    }

    return new Lesson(result.rows[0]);
  }

  /**
   * Récupère toutes les leçons
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Object>} Liste des leçons et métadonnées
   */
  static async findAll(options = {}) {
    const { category, difficulty, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_published = true';
    const values = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }

    if (difficulty) {
      whereClause += ` AND difficulty = $${paramIndex}`;
      values.push(difficulty);
      paramIndex++;
    }

    const countSql = `SELECT COUNT(*) FROM lessons ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    const sql = `
      SELECT id, slug, title, description, category, difficulty, order_index, duration_minutes, tags, created_at
      FROM lessons 
      ${whereClause}
      ORDER BY order_index ASC, created_at ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const result = await query(sql, values);

    return {
      lessons: result.rows.map((row) => new Lesson(row)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère les leçons par catégorie
   * @param {string} category - Catégorie
   * @returns {Promise<Array<Lesson>>} Liste des leçons
   */
  static async findByCategory(category) {
    const result = await this.findAll({ category, limit: 100 });
    return result.lessons;
  }

  /**
   * Met à jour une leçon
   * @param {string} id - ID de la leçon
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Lesson>} Leçon mise à jour
   */
  static async update(id, updates) {
    const allowedFields = [
      'title',
      'description',
      'content',
      'category',
      'difficulty',
      'order_index',
      'duration_minutes',
      'tags',
      'is_published',
    ];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(key === 'tags' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE lessons 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new Error('Leçon non trouvée');
    }

    return new Lesson(result.rows[0]);
  }

  /**
   * Supprime une leçon
   * @param {string} id - ID de la leçon
   * @returns {Promise<boolean>} Succès de l'opération
   */
  static async delete(id) {
    const sql = 'DELETE FROM lessons WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      throw new Error('Leçon non trouvée');
    }

    logger.info(`Leçon supprimée: ${id}`);
    return true;
  }

  /**
   * Enregistre le progrès d'un utilisateur sur une leçon
   * @param {string} userId - ID de l'utilisateur
   * @param {string} lessonId - ID de la leçon
   * @param {Object} progress - Données de progression
   * @returns {Promise<Object>} Progrès enregistré
   */
  static async saveProgress(userId, lessonId, progress) {
    const { completed = false, time_spent_seconds = 0 } = progress;

    const sql = `
      INSERT INTO user_lesson_progress (
        user_id, lesson_id, completed, time_spent_seconds, completed_at, last_accessed_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, ${completed ? 'NOW()' : 'NULL'}, NOW(), NOW(), NOW())
      ON CONFLICT (user_id, lesson_id) 
      DO UPDATE SET
        completed = EXCLUDED.completed OR user_lesson_progress.completed,
        time_spent_seconds = user_lesson_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
        completed_at = CASE 
          WHEN EXCLUDED.completed AND user_lesson_progress.completed_at IS NULL THEN NOW()
          ELSE user_lesson_progress.completed_at
        END,
        last_accessed_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(sql, [userId, lessonId, completed, time_spent_seconds]);
    return result.rows[0];
  }

  /**
   * Récupère le progrès d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Progrès de l'utilisateur
   */
  static async getUserProgress(userId) {
    const sql = `
      SELECT 
        l.id,
        l.slug,
        l.title,
        l.category,
        l.difficulty,
        l.order_index,
        COALESCE(p.completed, false) as completed,
        COALESCE(p.time_spent_seconds, 0) as time_spent_seconds,
        p.completed_at,
        p.last_accessed_at
      FROM lessons l
      LEFT JOIN user_lesson_progress p ON l.id = p.lesson_id AND p.user_id = $1
      WHERE l.is_published = true
      ORDER BY l.order_index ASC, l.created_at ASC
    `;

    const result = await query(sql, [userId]);

    const total = result.rows.length;
    const completed = result.rows.filter((r) => r.completed).length;
    const progress_percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      lessons: result.rows,
      summary: {
        total,
        completed,
        in_progress: result.rows.filter((r) => r.last_accessed_at && !r.completed).length,
        not_started: result.rows.filter((r) => !r.last_accessed_at).length,
        progress_percent,
      },
    };
  }

  /**
   * Récupère les catégories de leçons
   * @returns {Promise<Array>} Liste des catégories
   */
  static async getCategories() {
    const sql = `
      SELECT 
        category,
        COUNT(*) as lesson_count,
        MIN(order_index) as min_order
      FROM lessons 
      WHERE is_published = true
      GROUP BY category
      ORDER BY min_order ASC
    `;

    const result = await query(sql);
    return result.rows;
  }

  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      title: this.title,
      description: this.description,
      content: this.content,
      category: this.category,
      difficulty: this.difficulty,
      order_index: this.order_index,
      duration_minutes: this.duration_minutes,
      tags: this.tags,
      created_at: this.created_at,
    };
  }
}

module.exports = Lesson;