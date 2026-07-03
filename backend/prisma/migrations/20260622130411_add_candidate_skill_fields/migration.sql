-- AlterTable
ALTER TABLE `analysis_results` ADD COLUMN `candidate_name` VARCHAR(255) NULL,
    ADD COLUMN `matched_skills` JSON NULL,
    ADD COLUMN `unmatched_skills` JSON NULL;
