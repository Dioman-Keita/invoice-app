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
