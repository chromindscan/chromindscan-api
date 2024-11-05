-- CreateTable
CREATE TABLE "api_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "api_type_id" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "chromia_private_key" TEXT,
    "chromia_public_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_types_name_key" ON "api_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_user_id_api_type_id_key" ON "api_keys"("user_id", "api_type_id");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_api_type_id_fkey" FOREIGN KEY ("api_type_id") REFERENCES "api_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
