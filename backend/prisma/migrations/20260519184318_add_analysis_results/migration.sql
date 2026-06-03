-- CreateTable
CREATE TABLE `analysis_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `score` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `session_id` INTEGER NOT NULL,
    `cv_file_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `analysis_results` ADD CONSTRAINT `analysis_results_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `upload_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analysis_results` ADD CONSTRAINT `analysis_results_cv_file_id_fkey` FOREIGN KEY (`cv_file_id`) REFERENCES `cv_files`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
