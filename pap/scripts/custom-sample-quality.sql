-- Eliminar CHECK constraint que limita sample_quality a 'adequate'/'inadequate'
-- y aumentar longitud para permitir valores personalizados
ALTER TABLE diagnosis DROP CONSTRAINT IF EXISTS diagnosis_sample_quality_check;
ALTER TABLE diagnosis ALTER COLUMN sample_quality TYPE VARCHAR(100);
