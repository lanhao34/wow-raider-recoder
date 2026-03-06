-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "display_name" TEXT NOT NULL,
    "wow_class" TEXT NOT NULL,
    "wow_class_zh" TEXT NOT NULL,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raid_schedules" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "week_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "raid_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_raids" (
    "id" SERIAL NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "raid_id" TEXT NOT NULL,
    "raid_name" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,

    CONSTRAINT "schedule_raids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raid_kills" (
    "id" SERIAL NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "raid_id" TEXT NOT NULL,
    "boss_id" TEXT NOT NULL,
    "boss_name" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "participant_count" INTEGER NOT NULL,
    "drop_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raid_kills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drops" (
    "id" SERIAL NOT NULL,
    "raid_kill_id" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "is_tier" BOOLEAN NOT NULL DEFAULT false,
    "bonus_drop" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributions" (
    "id" SERIAL NOT NULL,
    "drop_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "distributed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distributed_by" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");
CREATE UNIQUE INDEX "schedule_raids_schedule_id_raid_id_difficulty_key" ON "schedule_raids"("schedule_id", "raid_id", "difficulty");
CREATE UNIQUE INDEX "distributions_drop_id_key" ON "distributions"("drop_id");
CREATE UNIQUE INDEX "requirements_member_id_item_id_key" ON "requirements"("member_id", "item_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raid_schedules" ADD CONSTRAINT "raid_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedule_raids" ADD CONSTRAINT "schedule_raids_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "raid_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raid_kills" ADD CONSTRAINT "raid_kills_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "raid_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "drops" ADD CONSTRAINT "drops_raid_kill_id_fkey" FOREIGN KEY ("raid_kill_id") REFERENCES "raid_kills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_drop_id_fkey" FOREIGN KEY ("drop_id") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
