-- Isolated, synthetic dataset for temporary partner testing.
-- Import this once with: mysql -u root -p < server/sql/public-demo.sql
-- Point server/.env at shamba_direct_public_demo before starting the API.

CREATE DATABASE IF NOT EXISTS shamba_direct_public_demo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shamba_direct_public_demo;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NULL,
  phone_number VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer','buyer','admin') NOT NULL DEFAULT 'farmer',
  county VARCHAR(100) NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_phone (phone_number),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS farmer_profiles (
  user_id INT PRIMARY KEY,
  farm_size VARCHAR(50) NULL,
  national_id VARCHAR(30) NULL,
  main_crops VARCHAR(255) NULL,
  CONSTRAINT fk_demo_farmer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_profiles (
  user_id INT PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  kra_pin VARCHAR(30) NULL,
  business_type VARCHAR(100) NULL,
  products_needed VARCHAR(255) NULL,
  delivery_address VARCHAR(255) NULL,
  CONSTRAINT fk_demo_company_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  county VARCHAR(100) NULL,
  harvest_note VARCHAR(255) NULL,
  image_emoji VARCHAR(10) NULL DEFAULT '🌾',
  status ENUM('active','pending_review','sold_out') NOT NULL DEFAULT 'pending_review',
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_demo_product_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  buyer_id INT NOT NULL,
  farmer_id INT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  status ENUM('pending','confirmed','delivered','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_demo_order_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_demo_order_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_demo_order_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  buyer_id INT NULL,
  farmer_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_demo_enquiry_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_demo_enquiry_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_demo_enquiry_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_info VARCHAR(150) NOT NULL,
  subject VARCHAR(150) NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS farmer_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  buyer_id INT NOT NULL,
  order_id INT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review_text VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_demo_rating_farmer FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_demo_rating_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_demo_rating_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT chk_demo_rating_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS headquarters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region_name VARCHAR(150) NOT NULL,
  county VARCHAR(100) NOT NULL,
  address VARCHAR(255) NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS market_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crop_name VARCHAR(100) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  county VARCHAR(100) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Both accounts use the demo-only password DemoOnly123! and synthetic contact data.
INSERT INTO users
  (id, full_name, email, phone_number, password_hash, role, county, is_verified)
VALUES
  (1, 'Demo Farmer', 'farmer@example.test', '07000000001',
   '$2a$10$VZhJuKWf8ymAb.ppxn3Y4uSfw5tbsMtyqGBEV8SbRCPWyk./4Fhyu', 'farmer', 'Kirinyaga', 1),
  (2, 'Demo Buyer', 'buyer@example.test', '07000000002',
   '$2a$10$VZhJuKWf8ymAb.ppxn3Y4uSfw5tbsMtyqGBEV8SbRCPWyk./4Fhyu', 'buyer', 'Nairobi', 0)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO farmer_profiles (user_id, farm_size, national_id, main_crops)
VALUES (1, 'Demo plot', NULL, 'Tomatoes')
ON DUPLICATE KEY UPDATE main_crops = VALUES(main_crops);

INSERT INTO company_profiles (user_id, company_name, kra_pin, business_type, products_needed, delivery_address)
VALUES (2, 'Demo Buyer Co', NULL, 'Test buyer', 'Tomatoes', 'Synthetic demo address')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO products
  (id, farmer_id, name, category, price_per_kg, quantity_kg, county, harvest_note, image_emoji, status)
VALUES
  (1, 1, 'Demo Tomatoes', 'Vegetables', 45.00, 500, 'Kirinyaga',
   'Synthetic API testing record', '🍅', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status);

INSERT INTO orders
  (id, product_id, buyer_id, farmer_id, quantity_kg, total_price, status)
VALUES (1, 1, 2, 1, 1.00, 45.00, 'delivered')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO enquiries (id, product_id, buyer_id, farmer_id, message)
VALUES (1, 1, 2, 1, 'Synthetic enquiry for API testing')
ON DUPLICATE KEY UPDATE message = VALUES(message);

INSERT INTO farmer_ratings (id, farmer_id, buyer_id, order_id, rating, review_text)
VALUES (1, 1, 2, 1, 5, 'Synthetic demo rating')
ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text);

INSERT INTO contact_messages (id, name, contact_info, subject, message)
VALUES (1, 'Demo Contact', 'contact@example.test', 'Synthetic test', 'Synthetic contact message')
ON DUPLICATE KEY UPDATE message = VALUES(message);

INSERT INTO headquarters (id, region_name, county, address, latitude, longitude)
VALUES (1, 'Demo HQ', 'Nairobi', 'Synthetic demo address', -1.286389, 36.817223)
ON DUPLICATE KEY UPDATE region_name = VALUES(region_name);

INSERT INTO market_prices (id, crop_name, price_per_kg, county)
VALUES
  (1, 'Tomatoes', 45.00, 'Kirinyaga'),
  (2, 'Maize', 32.00, 'Uasin Gishu'),
  (3, 'Potatoes', 28.00, 'Nyandarua')
ON DUPLICATE KEY UPDATE price_per_kg = VALUES(price_per_kg);
