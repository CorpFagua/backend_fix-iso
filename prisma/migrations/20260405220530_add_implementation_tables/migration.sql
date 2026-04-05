-- CreateTable
CREATE TABLE "implementation_tasks" (
    "id" SERIAL NOT NULL,
    "company_control_id" INTEGER NOT NULL,
    "dimension" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'not_started',
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_notes" (
    "id" SERIAL NOT NULL,
    "company_control_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "implementation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "implementation_tasks_company_control_id_dimension_key" ON "implementation_tasks"("company_control_id", "dimension");

-- AddForeignKey
ALTER TABLE "implementation_tasks" ADD CONSTRAINT "implementation_tasks_company_control_id_fkey" FOREIGN KEY ("company_control_id") REFERENCES "company_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_notes" ADD CONSTRAINT "implementation_notes_company_control_id_fkey" FOREIGN KEY ("company_control_id") REFERENCES "company_controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_notes" ADD CONSTRAINT "implementation_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
