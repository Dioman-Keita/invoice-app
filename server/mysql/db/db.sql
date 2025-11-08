-- Création de la base
CREATE DATABASE IF NOT EXISTS cmdt_invoice_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cmdt_invoice_db;

-- Table des fournisseurs
CREATE TABLE supplier (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    account_number CHAR(34) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_by VARCHAR(50) NULL,
    created_by_email VARCHAR(100) NULL,
    created_by_role ENUM('dfc_agent', 'invoice_manager', 'admin'),
    fiscal_year VARCHAR(7) NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des employés
CREATE TABLE employee (
    id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY NOT NULL,
    firstname VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    lastname VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    password VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    employee_cmdt_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL,
    role ENUM('dfc_agent', 'invoice_manager', 'admin') DEFAULT 'invoice_manager',
    phone VARCHAR(45),
    department VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    fiscal_year VARCHAR(7) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isVerified BOOLEAN DEFAULT FALSE,
    isActive BOOLEAN DEFAULT TRUE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des paramètres utilisateurs
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    settings JSON,
    FOREIGN KEY (user_id) REFERENCES employee(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tables des activitées utilisateurs
CREATE TABLE user_activity (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50),
    name ENUM(
        'SIGN_UP',
        'LOGIN', 
        'LOGOUT',
        'UPDATE_PASSWORD',
        'RESET_PASSWORD',
        'SEND_PASSWORD_RESET_EMAIL', 
        'REFRESH_SESSION',
        'SUBMIT_INVOICE',
        'VALIDATE_INVOICE',
        'UPDATE_EMPLOYEE_ID',
        'VIEW_PROFILE',
        'UPDATE_PROFILE',
        'REFRESH_PROFILE'
    ) DEFAULT 'LOGIN',
    created_at BIGINT NULL,
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES employee(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des départements
CREATE TABLE department (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name ENUM('Finance', 'Comptabilité', 'Contrôle de gestion', 'Audit interne', 'Facturation', 'Comptabilité client', 'Gestion des factures') DEFAULT 'Finance',
    employee_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des factures
CREATE TABLE invoice (
    id VARCHAR(30) PRIMARY KEY,
    num_cmdt VARCHAR(12) NOT NULL,
    num_invoice VARCHAR(20) NOT NULL,
    invoice_object VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    supplier_id INT,
    invoice_nature ENUM('Paiement', 'Acompte', 'Avoir') DEFAULT 'Paiement',
    invoice_arr_date DATE,
    invoice_date DATE,
    invoice_type ENUM('Ordinaire', 'Transporteur', 'Transitaire') DEFAULT 'Ordinaire',
    folio ENUM('1 copie', 'Orig + 1 copie', 'Orig + 2 copies', 'Orig + 3 copies') DEFAULT '1 copie',
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('Oui', 'Non') DEFAULT 'Non',
    dfc_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', 
    created_by VARCHAR(50),
    created_by_email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_by_role ENUM('dfc_agent', 'invoice_manager', 'admin'),
    fiscal_year VARCHAR(7) NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employee(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des pièces jointes
CREATE TABLE attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    documents JSON,
    invoice_id VARCHAR(30) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des tokens (authentification)
CREATE TABLE auth_token (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(767) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    employee_id VARCHAR(50),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table tampon pour gerer les envoies d'emails lors du register 
CREATE TABLE pending_verification (
    id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    employee_cmdt_id VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('dfc_agent', 'invoice_manager', 'admin') DEFAULT 'invoice_manager',
    phone VARCHAR(45),
    department VARCHAR(50) NOT NULL,
    fiscal_year VARCHAR(7) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table de log des exportations
CREATE TABLE export_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id VARCHAR(30),
    format ENUM('PDF', 'Excel', 'CSV', 'JSON', 'TXT'),
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exported_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id),
    FOREIGN KEY (exported_by) REFERENCES employee(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table de log des actions
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action ENUM('INSERT', 'UPDATE', 'DELETE', 'EXPORT', 'SELECT'),
    table_name VARCHAR(50),
    record_id VARCHAR(50),
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    performed_by VARCHAR(50),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES employee(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des décisions DFC (approbation/rejet) avec commentaires optionnels
CREATE TABLE dfc_decision (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id VARCHAR(30) NOT NULL,
    decision ENUM('approved', 'rejected') NOT NULL,
    comment TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    decided_by VARCHAR(50) NULL,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fiscal_year VARCHAR(7) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE CASCADE,
    FOREIGN KEY (decided_by) REFERENCES employee(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- table pour gérer les compteurs par année fiscale
CREATE TABLE fiscal_year_counter (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fiscal_year VARCHAR(7) NOT NULL,
    last_cmdt_number BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fiscal_year (fiscal_year)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table pour gérer les compteurs d'employés par année fiscale
CREATE TABLE employee_fiscal_year_counter (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fiscal_year VARCHAR(7) NOT NULL,
    last_employee_number BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_fiscal_year (fiscal_year)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- table enregistrant les parametres critiques de l'application
CREATE TABLE app_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    description TEXT,
    created_by VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES employee(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table app_settings configuration initiale
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('fiscal_year', '"2025"', 'Année fiscale en cours'),
('cmdt_format', '{"padding": 4, "max": 999999999999}', 'Format des numéros CMDT (support 1 milliard/an)'),
('year_end_warning_threshold', '900000000000', 'Seuil d avertissement fin d année (10% du milliard)'),
('auto_year_switch', 'true', 'Changement automatique d année fiscale'),
('app_theme', '{"theme": "light"}', 'Paramètres d apparence de l application'),
('app_version', '"1.0.0"', 'Version de l application');

-- Index
CREATE INDEX idx_employee_cmdt ON employee(employee_cmdt_id);
CREATE INDEX idx_employee ON employee(id);
CREATE INDEX idx_supplier ON supplier(name, account_number, phone);
CREATE INDEX idx_supplier_phone ON supplier(phone);
CREATE INDEX idx_invoice_status ON invoice(status);
CREATE INDEX idx_invoice_search ON invoice(num_invoice, invoice_type, status, create_at);
CREATE INDEX idx_invoice_date ON invoice(invoice_date);
CREATE INDEX idx_invoice_arr_date ON invoice(invoice_arr_date);
CREATE INDEX idx_invoice_created_by ON invoice(created_by);
CREATE INDEX idx_invoice_dfc_status ON invoice(dfc_status);
CREATE INDEX idx_dfc_decision_invoice ON dfc_decision(invoice_id);
CREATE INDEX idx_dfc_decision_fy ON dfc_decision(fiscal_year);
CREATE INDEX idx_dfc_decision_by ON dfc_decision(decided_by);
CREATE INDEX idx_dfc_decision_at ON dfc_decision(decided_at);
CREATE UNIQUE INDEX idx_supplier_account_number ON supplier(account_number);

-- Index pour les vérifications par année fiscale
CREATE INDEX idx_invoice_fiscal_year ON invoice(fiscal_year);
CREATE INDEX idx_invoice_cmdt_fiscal ON invoice(fiscal_year, num_cmdt);
CREATE INDEX idx_invoice_num_invoice_fiscal ON invoice(fiscal_year, num_invoice);

-- Index pour la performance des compteurs par année fiscal
CREATE INDEX idx_employee_fiscal_year ON employee(fiscal_year);
CREATE INDEX idx_fiscal_year_counter_year ON fiscal_year_counter(fiscal_year);
CREATE INDEX idx_employee_fiscal_year_counter_year ON employee_fiscal_year_counter(fiscal_year);
CREATE INDEX idx_pending_verification_fiscal_year ON pending_verification(fiscal_year);
CREATE INDEX idx_employee_created_at ON employee(created_at);
CREATE INDEX idx_employee_isVerified_created_at ON employee(isVerified, created_at);

-- Vues sur les audits
CREATE VIEW view_audit_log AS SELECT * FROM audit_log;
CREATE VIEW view_recent_audit_log AS SELECT * FROM view_audit_log ORDER BY performed_at DESC LIMIT 100;

-- Vues sur les exports
CREATE VIEW view_exports_by_agent AS SELECT * FROM export_log;
CREATE VIEW view_recent_export_by_agent AS SELECT * FROM view_exports_by_agent ORDER BY exported_at DESC LIMIT 100;

-- Vues sur les factures
CREATE VIEW view_invoice AS SELECT * FROM invoice;
CREATE VIEW view_invoice_by_status_reject AS SELECT * FROM view_invoice WHERE status = 'Oui';
CREATE VIEW view_invoice_by_status_accept AS SELECT * FROM view_invoice WHERE status = 'Non';