CREATE DATABASE cmdt_invoice_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE cmdt_invoice_db;

-- Table des fournisseurs
CREATE TABLE supplier(
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des employés
CREATE TABLE employee(
    id VARCHAR(50) PRIMARY KEY NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    employee_cmdt_id VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('dfc_agent', 'invoice_manager', 'admin') DEFAULT 'invoice_manager'
);

-- Table des parametres utilisateurs
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    settings JSON,
    FOREIGN KEY (user_id) REFERENCES employee(id)
);

-- Tables des départements
CREATE TABLE department(
    id INT PRIMARY KEY AUTO_INCREMENT,
    name ENUM('Finance', 'Comptabilité', 'Contrôle de gestion', 'Audit interne') DEFAULT 'Finance',
    employee_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Table des factures
CREATE TABLE invoice(
    id VARCHAR(15) PRIMARY KEY,
    num_cmdt VARCHAR(15) NOT NULL,
    num_invoice VARCHAR(15) NOT NULL,
    invoice_object TEXT,
    supplier_id INT,
    invoice_type ENUM('Ordinaire', 'Transporteur', 'Transitaire') DEFAULT 'Ordinaire',
    invoice_arr_date DATE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    folio ENUM('1 copie', 'Org + 1 copie', 'Org + 2 copies', 'Org + 3 copies') DEFAULT '1 copie',
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('Oui', 'Non') DEFAULT 'Non',
    FOREIGN KEY(supplier_id) REFERENCES supplier(id) ON DELETE CASCADE
);

-- Table des pièces jointes
CREATE TABLE attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    documents ENUM('Connaissement', 'Attestation de prise en charge', 'Lettre de voiture inter-Etats'),
    invoice_id VARCHAR(15) NOT NULL,
    FOREIGN KEY(invoice_id) REFERENCES invoice(id) ON DELETE CASCADE
);

-- Table des tokens (authentification)
CREATE TABLE auth_token (
    id INT PRIMARY KEY AUTO_INCREMENT,
    current_key DATE DEFAULT CURRENT_TIMESTAMP,
    token DATE NOT NULL UNIQUE,
    employee_id VARCHAR(50),
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Table dediée au log des exportation de données
CREATE TABLE export_log(
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id VARCHAR(15),
    format ENUM('PDF', 'Excel', 'CSV', 'JSON'),
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exported_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id),
    FOREIGN KEY (exported_by) REFERENCES employee(id)
);

-- Table dediée  au log de la base de donnes
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT, -- identifiant du log
    action ENUM('INSERT', 'UPDATE', 'DELETE', 'EXPORT', 'SELECT'), -- Type d'action enregistrée
    table_name VARCHAR(50), -- Non de la table concernée (Table qui subit l'action)
    record_id VARCHAR(50), -- Identifiant de l'enregistrement impacté
    description TEXT,  -- Résumé de l'action enregistré
    performed_by VARCHAR(50), -- ID de l'employé ayant effectué l'action
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Hordotage precis de l'action
    FOREIGN KEY (performed_by) REFERENCES employee(id) -- Assure que l'auteur de l'action est bien un employé enregistré
);

-- Liste des index
CREATE INDEX idx_employee_cmdt ON employee(employee_cmdt_id);
CREATE INDEX idx_employee ON employee(id);
CREATE INDEX idx_supplier ON supplier(name, email, phone); 
CREATE INDEX idx_supplier_phone ON supplier(phone);
CREATE INDEX idx_invoice_status ON invoice(status);
CREATE INDEX idx_invoice_search ON invoice(num_invoice, invoice_type, status, create_at);
CREATE INDEX idx_invoice_date ON invoice(invoice_date);
CREATE INDEX idx_invoice_arr_date ON invoice(invoice_arr_date);

-- Liste des views sur les audits
CREATE VIEW view_audit_log AS SELECT * FROM audit_log;
CREATE VIEW view_recent_audit_log AS SELECT * FROM view_audit_log ORDER BY performed_at DESC LIMIT 100;
-- liste des views sur les exports lié aux agents
CREATE VIEW view_exports_by_agent AS
SELECT * FROM export_log;
CREATE VIEW view_recent_export_by_agent AS
SELECT * FROM view_exports_by_agent ORDER BY exported_at DESC LIMIT 100;
-- liste des views sur les factures
CREATE VIEW view_invoice AS SELECT * FROM invoice;
CREATE VIEW view_invoice_by_status_reject AS SELECT * FROM view_invoice WHERE status = 'Oui';
CREATE VIEW view_invoice_by_status_accept AS SELECT * FROM view_invoice WHERE status = 'Non';

-- Liste des mises à jour ou changement realisés sur la table :
ALTER TABLE invoice ADD COLUMN amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER invoice_date;
ALTER TABLE attachments DROP COLUMN documents;
ALTER TABLE attachments ADD COLUMN documents JSON;