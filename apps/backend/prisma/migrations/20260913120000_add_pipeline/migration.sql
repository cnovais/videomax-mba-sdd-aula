ALTER TABLE "videos" ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN "failedStage" TEXT, ADD COLUMN "failureReason" TEXT, ADD COLUMN "audioStorageKey" TEXT;
CREATE TABLE "transcriptions" ("id" TEXT NOT NULL, "videoId" TEXT NOT NULL, "language" TEXT NOT NULL, "segments" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "transcriptions_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "transcriptions_videoId_key" ON "transcriptions"("videoId");
CREATE TABLE "summaries" ("id" TEXT NOT NULL, "videoId" TEXT NOT NULL, "overview" TEXT NOT NULL, "keyTopics" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "summaries_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "summaries_videoId_key" ON "summaries"("videoId");
ALTER TABLE "transcriptions" ADD CONSTRAINT "transcriptions_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
