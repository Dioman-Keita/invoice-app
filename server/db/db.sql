-- Création de la base
CREATE DATABASE IF NOT EXISTS cmdt_invoice_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cmdt_invoice_db;

-- Table des fournisseurs
CREATE TABLE supplier (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    account_number CHAR(12) NOT NULL,
    phone VARCHAR(20) NOT NULL,
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
    id VARCHAR(15) PRIMARY KEY,
    num_cmdt VARCHAR(15) NOT NULL,
    num_invoice VARCHAR(15) NOT NULL,
    invoice_object TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    supplier_id INT,
    invoice_type ENUM('Ordinaire', 'Transporteur', 'Transitaire') DEFAULT 'Ordinaire',
    invoice_arr_date DATE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    folio ENUM('1 copie', 'Org + 1 copie', 'Org + 2 copies', 'Org + 3 copies') DEFAULT '1 copie',
    amount DECIMAL(12,0) NOT NULL DEFAULT 0,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('Oui', 'Non') DEFAULT 'Non',
    created_by VARCHAR(50),
    created_by_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_by_role ENUM('dfc_agent', 'invoice_manager', 'admin'),
    FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employee(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des pièces jointes
CREATE TABLE attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    documents JSON,
    invoice_id VARCHAR(15) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table des tokens (authentification)
CREATE TABLE auth_token (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table de log des exportations
CREATE TABLE export_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id VARCHAR(15),
    format ENUM('PDF', 'Excel', 'CSV', 'JSON'),
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