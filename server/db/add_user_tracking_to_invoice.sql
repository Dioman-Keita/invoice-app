-- Ajouter les colonnes de traçabilité utilisateur à la table invoice
ALTER TABLE invoice 
ADD COLUMN created_by VARCHAR(50) AFTER status,
ADD COLUMN created_by_email VARCHAR(100) AFTER created_by,
ADD COLUMN created_by_role ENUM('dfc_agent', 'invoice_manager', 'admin') AFTER created_by_email;

-- Ajouter la clé étrangère pour created_by
ALTER TABLE invoice 
ADD FOREIGN KEY (created_by) REFERENCES employee(id) ON DELETE SET NULL;

-- Ajouter un index pour optimiser les requêtes par utilisateur
CREATE INDEX idx_invoice_created_by ON invoice(created_by);

-- Ajout des colonnes phone et department dans la table employee
ALTER TABLE employee ADD COLUMN phone VARCHAR(45) NULL;
ALTER TABLE employee ADD COLUMN department VARCHAR(50) NOT NULL;


-- 3) Plafond montant 100 000 000 000
-- Adapter le type pour supporter la valeur maximale
ALTER TABLE invoice 
MODIFY COLUMN amount DECIMAL(12,0) NOT NULL;

-- 4) Mise de de la table supplier
-- changement de la colone email par la colone account_number
ALTER TABLE supplier
CHANGE COLUMN email account_number CHAR(12) NOT NULL;

-- 5) Update de la table employee pour inclure creat_at
ALTER TABLE employee 
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 6) Update de la table employee pour inclure la table isVerified indiquand si une Table a ete verifiee ou non
 ALTER TABLE employee ADD COLUMN isVerified BOOLEAN DEFAULT FALSE;
--7) Update de la table employee pour inclure la table isActive
ALTER TABLE employee ADD COLUMN isActive BOOLEAN DEFAULT TRUE;