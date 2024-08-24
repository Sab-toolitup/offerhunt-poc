-- CreateTable
CREATE TABLE "bogo" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "goProductId" TEXT NOT NULL,
    "goProductHandle" TEXT NOT NULL,
    "goProductVarientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bogo_pkey" PRIMARY KEY ("id")
);
