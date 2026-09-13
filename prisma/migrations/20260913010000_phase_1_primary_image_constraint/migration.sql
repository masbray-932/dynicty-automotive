-- Enforce the application invariant that a car can have at most one cover image.
CREATE UNIQUE INDEX "CarImage_one_primary_per_car"
ON "CarImage" ("carId")
WHERE "isPrimary" = true;
