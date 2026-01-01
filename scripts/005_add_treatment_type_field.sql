-- Add treatment_type field to appointments table
-- This field stores the treatment type as a string, complementing the service_id reference
-- This allows for flexible treatment descriptions while maintaining service catalog references

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS treatment_type TEXT;

-- Create index for treatment_type to improve query performance
CREATE INDEX IF NOT EXISTS idx_appointments_treatment_type ON appointments(treatment_type);

-- Update existing appointments to set treatment_type from service name
-- This ensures backward compatibility with existing data
UPDATE appointments a
SET treatment_type = s.name
FROM services s
WHERE a.service_id = s.id AND a.treatment_type IS NULL;
