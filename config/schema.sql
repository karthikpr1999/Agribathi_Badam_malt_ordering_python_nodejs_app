-- =============================================================
-- Agribathi & Badam Malt Order App — MySQL Schema
-- Run this once in MySQL Workbench or MySQL CLI:
--   mysql -u root -p < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS agribathi_orders
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agribathi_orders;

-- Products (seeded once; prices live in config/prices.json)
CREATE TABLE IF NOT EXISTS products (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    sku        VARCHAR(50)  NOT NULL UNIQUE,
    unit_label VARCHAR(50)  NOT NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Orders (one row per customer visit)
CREATE TABLE IF NOT EXISTS orders (
    id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    customer_name   VARCHAR(150)  NOT NULL,
    customer_phone  VARCHAR(20)   NOT NULL,
    order_date      DATE          NOT NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes           TEXT          NULL,
    PRIMARY KEY (id),
    INDEX idx_order_date      (order_date),
    INDEX idx_customer_phone  (customer_phone),
    INDEX idx_customer_name   (customer_name)
) ENGINE=InnoDB;

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    order_id    INT UNSIGNED  NOT NULL,
    product_id  INT UNSIGNED  NOT NULL,
    quantity    DECIMAL(10,3) NOT NULL,
    unit_price  DECIMAL(10,2) NOT NULL,
    line_total  DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_oi_order
        FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    CONSTRAINT fk_oi_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_oi_order_id   (order_id),
    INDEX idx_oi_product_id (product_id)
) ENGINE=InnoDB;

-- Seed the three products
INSERT IGNORE INTO products (name, sku, unit_label) VALUES
    ('Agribathi Tubes',   'AGRI_TUBE',  'dozen'),
    ('Masala Agribathis', 'MASALA_250', '250g packet'),
    ('Badam Malt',        'BADAM_200',  '200g packet');
