-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rankName" TEXT NOT NULL,
    "rankDiv" INTEGER,
    "rankScore" INTEGER,
    "ladderPos" INTEGER,

    CONSTRAINT "RankSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "legend" TEXT,
    "placement" INTEGER,
    "kills" INTEGER,
    "damage" INTEGER,
    "rpChange" INTEGER,
    "rankScoreAfter" INTEGER,
    "rankName" TEXT,
    "rankDiv" INTEGER,
    "raw" JSONB,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_platform_name_key" ON "Account"("platform", "name");

-- CreateIndex
CREATE INDEX "RankSnapshot_accountId_capturedAt_idx" ON "RankSnapshot"("accountId", "capturedAt");

-- CreateIndex
CREATE INDEX "Match_accountId_playedAt_idx" ON "Match"("accountId", "playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_accountId_matchId_key" ON "Match"("accountId", "matchId");

-- AddForeignKey
ALTER TABLE "RankSnapshot" ADD CONSTRAINT "RankSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
