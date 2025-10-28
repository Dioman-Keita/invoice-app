-- Script pour corriger la longueur des colonnes
-- Exécuter cette requête sur la base de données existante

USE cmdt_invoice_db;

-- Correction num_cmdt : VARCHAR(10) -> VARCHAR(12) (support 12 chiffres)
ALTER TABLE invoice MODIFY COLUMN num_cmdt VARCHAR(12) NOT NULL;

-- Correction created_by : VARCHAR(15) -> VARCHAR(30) (support IDs employés comme EMP-2025-000000001)
ALTER TABLE invoice MODIFY COLUMN created_by VARCHAR(30);

-- Vérification des modifications
DESCRIBE invoice;
