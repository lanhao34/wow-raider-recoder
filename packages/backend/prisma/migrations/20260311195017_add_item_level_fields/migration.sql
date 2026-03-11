/*
  Warnings:

  - Added the required column `item_level` to the `drops` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "drops" ADD COLUMN     "armor_type" TEXT,
ADD COLUMN     "base_item_level" INTEGER,
ADD COLUMN     "item_level" INTEGER NOT NULL,
ADD COLUMN     "quality" TEXT NOT NULL DEFAULT 'epic';
