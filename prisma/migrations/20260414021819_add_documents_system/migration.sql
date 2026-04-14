-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ACTA', 'REPORTE_AUDITORIA', 'EVIDENCIA', 'POLITICA', 'PLAN_TRATAMIENTO', 'INFORME_CAPACITACION', 'PLANTILLA');

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "name" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "document_type" "DocumentType" NOT NULL,
    "drive_file_id" VARCHAR(200),
    "drive_url" VARCHAR(500),
    "drive_folder_id" VARCHAR(200),
    "related_entity_type" VARCHAR(50),
    "related_entity_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_company_id_document_type_idx" ON "documents"("company_id", "document_type");

-- CreateIndex
CREATE INDEX "documents_related_entity_type_related_entity_id_idx" ON "documents"("related_entity_type", "related_entity_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
