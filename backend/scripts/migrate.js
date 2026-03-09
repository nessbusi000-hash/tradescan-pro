const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://tradescan_db_user:gKMrdzCrGN5d0VlLaK8kb0XOS7jmdoGB@dpg-d6nh5oc50q8c73boron0-a.oregon-postgres.render.com/tradescan_db',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      role VARCHAR(20) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      email_verified BOOLEAN DEFAULT false,
      preferences JSONB DEFAULT '{"theme":"dark"}',
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      symbol VARCHAR(10) NOT NULL,
      type VARCHAR(10) NOT NULL,
      order_type VARCHAR(20) DEFAULT 'market',
      volume DECIMAL(15,8) NOT NULL,
      entry_price DECIMAL(15,8) NOT NULL,
      exit_price DECIMAL(15,8),
      stop_loss DECIMAL(15,8),
      take_profit DECIMAL(15,8),
      status VARCHAR(20) DEFAULT 'open',
      pnl DECIMAL(15,2),
      pnl_percent DECIMAL(8,4),
      commission DECIMAL(10,4) DEFAULT 0,
      swap DECIMAL(10,4) DEFAULT 0,
      strategy VARCHAR(50),
      timeframe VARCHAR(10),
      notes TEXT,
      opened_at TIMESTAMPTZ DEFAULT NOW(),
      closed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      difficulty VARCHAR(20) DEFAULT 'beginner',
      order_index INTEGER DEFAULT 0,
      duration_minutes INTEGER DEFAULT 10,
      tags JSONB DEFAULT '[]',
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_lesson_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT false,
      time_spent_seconds INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Toutes les tables créées !');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });