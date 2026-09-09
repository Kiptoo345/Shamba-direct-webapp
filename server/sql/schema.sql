-- =====================================================================
-- Shamba Direct — Full Database Schema
-- =====================================================================
-- This file creates every table needed to back the real INSERT, UPDATE
-- and DELETE operations used across the app (auth, listings, orders,
-- enquiries, contact form, ratings, buyer headquarters, market prices).
--
-- Usage:
--   mysql -u root -p < schema.sql
-- or
--   SOURCE schema.sql;   (from inside the MySQL client)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS shamba_direct_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shamba_direct_db;

-- ---------------------------------------------------------------------
-- 1. users — one row per account (farmer or buyer/company)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(150)      NOT NULL,
  email           VARCHAR(150)      NULL,
  phone_number    VARCHAR(20)       NOT NULL,
  password_hash   VARCHAR(255)      NOT NULL,
  role            ENUM('farmer','buyer','admin') NOT NULL DEFAULT 'farmer',
  county          VARCHAR(100)      NULL,
  is_verified     TINYINT(1)        NOT NULL DEFAULT 0,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_phone (phone_number),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. farmer_profiles — extra fields only farmers have
--    (national_id kept here so it's easy to exclude from public SELECTs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmer_profiles (
  user_id         INT               PRIMARY KEY,
  farm_size       VARCHAR(50)       NULL,
  national_id     VARCHAR(30)       NULL,
  main_crops      VARCHAR(255)      NULL,
  CONSTRAINT fk_farmer_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. company_profiles — extra fields only buyers/companies have
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_profiles (
  user_id           INT             PRIMARY KEY,
  company_name      VARCHAR(150)    NOT NULL,
  kra_pin           VARCHAR(30)     NULL,
  business_type     VARCHAR(100)    NULL,
  products_needed   VARCHAR(255)    NULL,
  delivery_address  VARCHAR(255)    NULL,
  CONSTRAINT fk_company_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. products — produce listings posted by farmers
--    (replaces the old flat "products" demo table; INSERT/UPDATE/DELETE
--    all live behind /api/products)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id       INT               NOT NULL,
  name            VARCHAR(150)      NOT NULL,
  category        VARCHAR(100)      NULL,
  price_per_kg    DECIMAL(10,2)     NOT NULL,
  quantity_kg     DECIMAL(10,2)     NOT NULL,
  county          VARCHAR(100)      NULL,
  harvest_note    VARCHAR(255)      NULL,
  image_emoji     VARCHAR(10)       NULL DEFAULT '🌾',
  status          ENUM('active','pending_review','sold_out') NOT NULL DEFAULT 'pending_review',
  views           INT               NOT NULL DEFAULT 0,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_farmer
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. orders — a buyer's order against a listing
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT               NOT NULL,
  buyer_id        INT               NOT NULL,
  farmer_id       INT               NOT NULL,
  quantity_kg     DECIMAL(10,2)     NOT NULL,
  total_price     DECIMAL(12,2)     NOT NULL,
  status          ENUM('pending','confirmed','delivered','cancelled') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_orders_farmer  FOREIGN KEY (farmer_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. enquiries — "Contact Farmer" messages sent from the marketplace
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  product_id      INT               NOT NULL,
  buyer_id        INT               NULL,
  farmer_id       INT               NOT NULL,
  message         TEXT              NOT NULL,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enquiries_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_enquiries_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE SET NULL,
  CONSTRAINT fk_enquiries_farmer  FOREIGN KEY (farmer_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. contact_messages — the public "About & Contact" page form
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)      NOT NULL,
  contact_info    VARCHAR(150)      NOT NULL,
  subject         VARCHAR(150)      NULL,
  message         TEXT              NOT NULL,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. farmer_ratings — buyer reviews left after a delivered order
--    (used to compute the "Farmer Rating" metric on the dashboard)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmer_ratings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id       INT               NOT NULL,
  buyer_id        INT               NOT NULL,
  order_id        INT               NULL,
  rating          TINYINT UNSIGNED  NOT NULL,
  review_text     VARCHAR(500)      NULL,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ratings_farmer FOREIGN KEY (farmer_id) REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ratings_buyer  FOREIGN KEY (buyer_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ratings_order  FOREIGN KEY (order_id)  REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT chk_rating_range  CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. headquarters — company/buyer hubs (referenced by API_NEEDS.md /
--    ENDPOINTS_LIST.md for the SettleIn downstream integration)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS headquarters (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  region_name     VARCHAR(150)      NOT NULL,
  county          VARCHAR(100)      NOT NULL,
  address         VARCHAR(255)      NULL,
  latitude        DECIMAL(9,6)      NULL,
  longitude       DECIMAL(9,6)      NULL,
  created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. market_prices — scheduled/cached commodity price feed
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_prices (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  crop_name       VARCHAR(100)      NOT NULL,
  price_per_kg    DECIMAL(10,2)     NOT NULL,
  county          VARCHAR(100)      NULL,
  updated_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- Seed data (optional) — enough to make the marketplace/dashboard
-- non-empty the first time the app is run.
-- =====================================================================
INSERT INTO users (full_name, email, phone_number, password_hash, role, county, is_verified) VALUES
  ('James Mwangi', 'james@example.com', '0712345001', '$2a$10$placeholderplaceholderplaceholderplaceh', 'farmer', 'Kirinyaga', 1),
  ('Grace Achieng', 'grace@example.com', '0712345002', '$2a$10$placeholderplaceholderplaceholderplaceh', 'farmer', 'Uasin Gishu', 1),
  ('Nairobi Provisions Ltd', 'procurement@nairobiprovisions.co.ke', '0712345003', '$2a$10$placeholderplaceholderplaceholderplaceh', 'buyer', 'Nairobi', 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO farmer_profiles (user_id, farm_size, national_id, main_crops) VALUES
  (1, '1 – 5 acres', NULL, 'Tomatoes, Spring Onions'),
  (2, '5 – 20 acres', NULL, 'Maize')
ON DUPLICATE KEY UPDATE main_crops = VALUES(main_crops);

INSERT INTO company_profiles (user_id, company_name, kra_pin, business_type, products_needed, delivery_address) VALUES
  (3, 'Nairobi Provisions Ltd', NULL, 'Supermarket / Retail', 'Tomatoes, Maize, Onions', 'Nairobi CBD')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO products (farmer_id, name, category, price_per_kg, quantity_kg, county, harvest_note, image_emoji, status, views) VALUES
  (1, 'Roma Tomatoes', 'Vegetables', 45.00, 800, 'Kirinyaga', 'Harvested 2 days ago', '🍅', 'active', 47),
  (2, 'Grade A Maize', 'Cereals & Grains', 32.00, 3500, 'Uasin Gishu', 'Post-harvest dry', '🌽', 'active', 22)
ON DUPLICATE KEY UPDATE price_per_kg = VALUES(price_per_kg);

INSERT INTO market_prices (crop_name, price_per_kg, county) VALUES
  ('Tomatoes', 45.00, 'Kirinyaga'),
  ('Maize', 32.00, 'Uasin Gishu'),
  ('Potatoes', 28.00, 'Nyandarua')
ON DUPLICATE KEY UPDATE price_per_kg = VALUES(price_per_kg);

INSERT INTO headquarters (region_name, county, address) VALUES
  ('Shamba Direct HQ', 'Nairobi', '2nd Floor, Ngong Road Plaza, Ngong Road, Nairobi')
ON DUPLICATE KEY UPDATE address = VALUES(address);
