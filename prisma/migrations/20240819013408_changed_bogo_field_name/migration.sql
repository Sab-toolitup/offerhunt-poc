/*
  Warnings:

  - You are about to drop the column `goProductVarientId` on the `bogo` table. All the data in the column will be lost.
  - Added the required column `goProductVariantId` to the `bogo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bogo" DROP COLUMN "goProductVarientId",
ADD COLUMN     "goProductVariantId" TEXT NOT NULL;
