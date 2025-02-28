/*
  Warnings:

  - The primary key for the `Url` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `shortUrl` on the `Url` table. All the data in the column will be lost.
  - The `id` column on the `Url` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Url` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Url_shortUrl_key";

-- AlterTable
ALTER TABLE "Url" DROP CONSTRAINT "Url_pkey",
DROP COLUMN "shortUrl",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Url_pkey" PRIMARY KEY ("id");
