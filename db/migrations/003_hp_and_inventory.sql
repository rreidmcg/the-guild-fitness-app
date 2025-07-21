
-- Migration to add HP system and inventory tables
-- This migration adds currentHp and maxHp columns to users table
-- and creates inventory-related tables

-- Add HP columns to users table
ALTER TABLE users ADD COLUMN currentHp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN maxHp INTEGER DEFAULT 0;

-- Update existing users to have proper HP values based on stamina
-- Base HP is 10 + (stamina * 3)
UPDATE users SET 
  maxHp = 10 + (stamina * 3),
  currentHp = 10 + (stamina * 3)
WHERE maxHp = 0;

-- Create items table for inventory system
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'weapon', 'armor', 'consumable', etc.
  rarity TEXT DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  value INTEGER DEFAULT 0, -- gold value
  stats TEXT, -- JSON string for item stats (attack, defense, etc.)
  requirements TEXT, -- JSON string for level/stat requirements
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user_inventory table to track player items
CREATE TABLE IF NOT EXISTS user_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  itemId INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT FALSE,
  acquiredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (itemId) REFERENCES items (id) ON DELETE CASCADE,
  UNIQUE(userId, itemId) -- Prevent duplicate item entries for same user
);

-- Insert some basic starting items
INSERT OR IGNORE INTO items (name, description, type, rarity, value, stats) VALUES
('Rusty Sword', 'A worn blade that has seen better days', 'weapon', 'common', 10, '{"attack": 2}'),
('Wooden Shield', 'Basic protection made from sturdy oak', 'shield', 'common', 8, '{"defense": 1}'),
('Health Potion', 'Restores 25 HP when consumed', 'consumable', 'common', 15, '{"heal": 25}'),
('Leather Armor', 'Simple protection for new adventurers', 'armor', 'common', 20, '{"defense": 2}'),
('Iron Sword', 'A reliable weapon for seasoned fighters', 'weapon', 'uncommon', 50, '{"attack": 5}');
