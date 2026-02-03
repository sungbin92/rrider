-- CreateTable
CREATE TABLE "segment" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "strava_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "climb_category" INTEGER NOT NULL,
    "avg_grade" DOUBLE PRECISION NOT NULL,
    "start_lat" DOUBLE PRECISION NOT NULL,
    "start_lng" DOUBLE PRECISION NOT NULL,
    "end_lat" DOUBLE PRECISION NOT NULL,
    "end_lng" DOUBLE PRECISION NOT NULL,
    "elev_difference" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "polyline" TEXT,
    "effort_count" INTEGER,
    "athlete_count" INTEGER,
    "star_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strava_token" (
    "id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strava_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "segment_route_id_strava_id_key" ON "segment"("route_id", "strava_id");

-- AddForeignKey
ALTER TABLE "segment" ADD CONSTRAINT "segment_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
