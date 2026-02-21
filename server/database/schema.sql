-- ===================================================
-- RMS Database Schema
-- TiDB Cloud (MySQL-compatible)
-- ===================================================

-- Use existing database (TiDB default is 'test')
USE test;

-- ===================================================
-- Users Table
-- ===================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    phone VARCHAR(20),
    department VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_verified (is_verified)
);

-- ===================================================
-- Categories Table
-- ===================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'fa-box',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_slug (slug)
);

-- Insert default categories
INSERT INTO categories (name, slug, icon, description) VALUES
('Books', 'books', 'fa-book', 'Textbooks, novels, study materials'),
('Electronics', 'electronics', 'fa-laptop', 'Laptops, chargers, cables, gadgets'),
('Sports', 'sports', 'fa-basketball', 'Sports equipment, fitness gear'),
('Tools', 'tools', 'fa-tools', 'Hand tools, power tools, equipment'),
('Clothing', 'clothing', 'fa-tshirt', 'Clothes, shoes, accessories'),
('Furniture', 'furniture', 'fa-couch', 'Chairs, tables, storage'),
('Rooms', 'rooms', 'fa-door-open', 'Empty rooms, study spaces'),
('Notes', 'notes', 'fa-file-alt', 'Class notes, study guides'),
('Lab Equipment', 'lab-equipment', 'fa-flask', 'Scientific equipment, kits'),
('Other', 'other', 'fa-box-open', 'Miscellaneous items');

-- ===================================================
-- Resources Table
-- ===================================================
CREATE TABLE resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    condition ENUM('new', 'good', 'fair', 'poor') DEFAULT 'good',
    availability ENUM('available', 'unavailable', 'reserved') DEFAULT 'available',
    location VARCHAR(255),
    images JSON,
    contact_info VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,

    INDEX idx_owner (owner_id),
    INDEX idx_category (category_id),
    INDEX idx_availability (availability),
    INDEX idx_verified (is_verified),
    INDEX idx_created (created_at)
);

-- ===================================================
-- Requests Table
-- ===================================================
CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    requester_id INT NOT NULL,
    owner_id INT NOT NULL,
    message TEXT,
    duration VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected', 'returned', 'cancelled') DEFAULT 'pending',
    admin_note TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    returned_at TIMESTAMP NULL,

    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_resource (resource_id),
    INDEX idx_requester (requester_id),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at)
);

-- ===================================================
-- Activity Log Table
-- ===================================================
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);

-- ===================================================
-- Sample Data (for testing)
-- ===================================================
-- Note: Sample users are inserted via init script with proper password hashes
-- Default passwords: admin@rms.local / admin123, john@rms.local / user123
