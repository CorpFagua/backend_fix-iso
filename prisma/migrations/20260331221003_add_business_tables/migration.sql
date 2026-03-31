-- CreateTable
CREATE TABLE "sectors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_sizes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "min_employees" INTEGER NOT NULL,
    "max_employees" INTEGER,

    CONSTRAINT "company_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "size_id" INTEGER NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "engagement_start" DATE,
    "engagement_end" DATE,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_services" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "service_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "start_date" DATE,
    "end_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_users" (
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_in_company" VARCHAR(100),
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("company_id","user_id")
);

-- CreateTable
CREATE TABLE "iso_themes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "iso_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iso_controls" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "theme_id" INTEGER NOT NULL,
    "control_type" VARCHAR(20) NOT NULL,
    "properties" VARCHAR(100) NOT NULL,
    "version" VARCHAR(10) NOT NULL DEFAULT '2022',

    CONSTRAINT "iso_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_applicability" (
    "id" SERIAL NOT NULL,
    "control_id" INTEGER NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "size_id" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "control_applicability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statements_of_applicability" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "control_id" INTEGER NOT NULL,
    "applicable" BOOLEAN NOT NULL,
    "justification" TEXT,
    "implementation_status" VARCHAR(30) NOT NULL DEFAULT 'not_started',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statements_of_applicability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_controls" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "control_id" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "maturity_level" VARCHAR(20) NOT NULL DEFAULT 'initial',
    "compliance_percentage" INTEGER NOT NULL DEFAULT 0,
    "assigned_user" INTEGER,
    "implementation_date" DATE,
    "review_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_evidence" (
    "id" SERIAL NOT NULL,
    "company_control_id" INTEGER NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "uploaded_by" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "asset_type" VARCHAR(30) NOT NULL,
    "classification" VARCHAR(20) NOT NULL DEFAULT 'internal',
    "owner_id" INTEGER NOT NULL,
    "custodian_id" INTEGER,
    "location" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_risk_assessments" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "threat" VARCHAR(255) NOT NULL,
    "vulnerability" VARCHAR(255) NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" VARCHAR(20) NOT NULL,
    "treatment" VARCHAR(20) NOT NULL,
    "treatment_plan" TEXT,
    "residual_risk_score" DOUBLE PRECISION,
    "assessed_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "auditor_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_results" (
    "id" SERIAL NOT NULL,
    "audit_id" INTEGER NOT NULL,
    "control_id" INTEGER NOT NULL,
    "result" VARCHAR(30) NOT NULL,
    "comments" TEXT,
    "evidence" VARCHAR(500),

    CONSTRAINT "audit_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" VARCHAR(20) NOT NULL,
    "analysis" TEXT NOT NULL,
    "methodology" VARCHAR(100) NOT NULL,
    "scope" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "trainer_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "training_type" VARCHAR(30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_attendees" (
    "training_id" INTEGER NOT NULL,
    "attendee_name" VARCHAR(150) NOT NULL,
    "attendee_email" VARCHAR(255),
    "attended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "training_attendees_pkey" PRIMARY KEY ("training_id","attendee_name")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sectors_name_key" ON "sectors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_sizes_name_key" ON "company_sizes"("name");

-- CreateIndex
CREATE INDEX "companies_sector_id_idx" ON "companies"("sector_id");

-- CreateIndex
CREATE INDEX "companies_size_id_idx" ON "companies"("size_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_services_company_id_service_type_key" ON "company_services"("company_id", "service_type");

-- CreateIndex
CREATE UNIQUE INDEX "iso_themes_name_key" ON "iso_themes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "iso_controls_code_key" ON "iso_controls"("code");

-- CreateIndex
CREATE INDEX "iso_controls_theme_id_idx" ON "iso_controls"("theme_id");

-- CreateIndex
CREATE UNIQUE INDEX "control_applicability_control_id_sector_id_size_id_key" ON "control_applicability"("control_id", "sector_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "statements_of_applicability_company_id_control_id_key" ON "statements_of_applicability"("company_id", "control_id");

-- CreateIndex
CREATE INDEX "company_controls_status_idx" ON "company_controls"("status");

-- CreateIndex
CREATE UNIQUE INDEX "company_controls_company_id_control_id_key" ON "company_controls"("company_id", "control_id");

-- CreateIndex
CREATE INDEX "assets_company_id_idx" ON "assets"("company_id");

-- CreateIndex
CREATE INDEX "assets_asset_type_idx" ON "assets"("asset_type");

-- CreateIndex
CREATE INDEX "audits_company_id_idx" ON "audits"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_results_audit_id_control_id_key" ON "audit_results"("audit_id", "control_id");

-- CreateIndex
CREATE INDEX "risk_assessments_company_id_idx" ON "risk_assessments"("company_id");

-- CreateIndex
CREATE INDEX "trainings_company_id_idx" ON "trainings"("company_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "company_sizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_services" ADD CONSTRAINT "company_services_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iso_controls" ADD CONSTRAINT "iso_controls_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "iso_themes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_applicability" ADD CONSTRAINT "control_applicability_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "iso_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_applicability" ADD CONSTRAINT "control_applicability_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_applicability" ADD CONSTRAINT "control_applicability_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "company_sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_applicability" ADD CONSTRAINT "statements_of_applicability_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_applicability" ADD CONSTRAINT "statements_of_applicability_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "iso_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_controls" ADD CONSTRAINT "company_controls_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_controls" ADD CONSTRAINT "company_controls_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "iso_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_controls" ADD CONSTRAINT "company_controls_assigned_user_fkey" FOREIGN KEY ("assigned_user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_evidence" ADD CONSTRAINT "control_evidence_company_control_id_fkey" FOREIGN KEY ("company_control_id") REFERENCES "company_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_evidence" ADD CONSTRAINT "control_evidence_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_custodian_id_fkey" FOREIGN KEY ("custodian_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_risk_assessments" ADD CONSTRAINT "asset_risk_assessments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_risk_assessments" ADD CONSTRAINT "asset_risk_assessments_assessed_by_fkey" FOREIGN KEY ("assessed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_results" ADD CONSTRAINT "audit_results_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_results" ADD CONSTRAINT "audit_results_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "iso_controls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_attendees" ADD CONSTRAINT "training_attendees_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
