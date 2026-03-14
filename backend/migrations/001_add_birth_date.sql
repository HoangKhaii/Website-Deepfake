-- Migration: Add birth_date column to users table
-- Run this script to add birth_date column if it doesn't exist

ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
