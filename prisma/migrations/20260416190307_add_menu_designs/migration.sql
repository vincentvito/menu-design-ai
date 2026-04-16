-- CreateTable
CREATE TABLE "menu_design" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "variantLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "replicateUrl" TEXT,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_design_userId_createdAt_idx" ON "menu_design"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "prediction_designId_idx" ON "prediction"("designId");

-- AddForeignKey
ALTER TABLE "menu_design" ADD CONSTRAINT "menu_design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction" ADD CONSTRAINT "prediction_designId_fkey" FOREIGN KEY ("designId") REFERENCES "menu_design"("id") ON DELETE CASCADE ON UPDATE CASCADE;
