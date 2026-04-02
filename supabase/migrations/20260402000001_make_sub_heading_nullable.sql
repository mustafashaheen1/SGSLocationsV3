-- Make sub_heading nullable so missing values don't crash inserts
ALTER TABLE properties ALTER COLUMN sub_heading DROP NOT NULL;
