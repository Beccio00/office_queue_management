-- CreateTable
CREATE TABLE "services" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avgServiceTime" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "counters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "counter_services" (
    "counterId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    PRIMARY KEY ("counterId", "serviceId"),
    CONSTRAINT "counter_services_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "counters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "counter_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "counterId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" DATETIME,
    "servedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "tickets_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tickets_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "counters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "services_tag_key" ON "services"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "counters_name_key" ON "counters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_code_key" ON "tickets"("code");
