/**
 * Modèle Utilisateur
 * ==================
 */

const { query } = require('../config/database');
const { hashPassword, verifyPassword } = require('../config/auth');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.role = data.role || 'user';
    this.is_active = data.is_active ?? true;
    this.email_verified = data.email_verified ?? false;
    this.avatar_url = data.avatar_url;
    this.preferences = data.preferences || {};
    this.last_login = data.last_login;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<User>} Utilisateur créé
   */
  static async create(userData) {
    const { email, password, first_name, last_name } = userData;
    
    // Hash du mot de passe
    const password_hash = await hashPassword(password);
    
    const id = uuidv4();
    const sql = `
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified, preferences, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      id,
      email.toLowerCase().trim(),
      password_hash,
      first_name?.trim(),
      last_name?.trim(),
      'user',
      true,
      false,
      JSON.stringify({ theme: 'dark', notifications: true }),
    ];
    
    try {
      const result = await query(sql, values);
      logger.info(`Utilisateur créé: ${email}`);
      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Cet email est déjà utilisé');
      }
      throw error;
    }
  }

  /**
   * Trouve un utilisateur par ID
   * @param {string} id - ID de l'utilisateur
   * @returns {Promise<User|null>} Utilisateur trouvé ou null
   */
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Trouve un utilisateur par email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<User|null>} Utilisateur trouvé ou null
   */
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await query(sql, [email.toLowerCase().trim()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Vérifie les identifiants de connexion
   * @param {string} email - Email
   * @param {string} password - Mot de passe
   * @returns {Promise<User|null>} Utilisateur si authentifié, null sinon
   */
  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    // Mise à jour de la dernière connexion
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    logger.info(`Authentification réussie: ${email}`);
    return user;
  }

  /**
   * Met à jour un utilisateur
   * @param {string} id - ID de l'utilisateur
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<User>} Utilisateur mis à jour
   */
  static async update(id, updates) {
    const allowedFields = ['first_name', 'last_name', 'avatar_url', 'preferences', 'email_verified'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(key === 'preferences' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }
    
    if (setClause.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }
    
    setClause.push(`updated_at = NOW()`);
    values.push(id);
    
    const sql = `
      UPDATE users 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const result = await query(sql, values);
    
    if (result.rows.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return new User(result.rows[0]);
  }

  /**
   * Change le mot de passe
   * @param {string} id - ID de l'utilisateur
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<boolean>} Succès de l'opération
   */
  static async changePassword(id, newPassword) {
    const password_hash = await hashPassword(newPassword);
    
    const sql = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id
    `;
    
    const result = await query(sql, [password_hash, id]);
    
    if (result.rows.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }
    
    logger.info(`Mot de passe changé pour l'utilisateur: ${id}`);
    return true;
  }

  /**
   * Désactive un utilisateur (soft delete)
   * @param {string} id - ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  static async deactivate(id) {
    const sql = `
      UPDATE users 
      SET is_active = false, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }
    
    logger.info(`Utilisateur désactivé: ${id}`);
    return true;
  }

  /**
   * Récupère tous les utilisateurs (avec pagination)
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} Liste des utilisateurs et métadonnées
   */
  static async findAll(options = {}) {
    const { page = 1, limit = 20, role } = options;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE is_active = true';
    const values = [];
    
    if (role) {
      whereClause += ' AND role = $1';
      values.push(role);
    }
    
    const countSql = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);
    
    const sql = `
      SELECT id, email, first_name, last_name, role, is_active, email_verified, avatar_url, last_login, created_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    values.push(limit, offset);
    const result = await query(sql, values);
    
    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retourne l'utilisateur sans le hash du mot de passe
   * @returns {Object} Données publiques de l'utilisateur
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      full_name: `${this.first_name || ''} ${this.last_name || ''}`.trim(),
      role: this.role,
      is_active: this.is_active,
      email_verified: this.email_verified,
      avatar_url: this.avatar_url,
      preferences: this.preferences,
      last_login: this.last_login,
      created_at: this.created_at,
    };
  }
}

module.exports = User;