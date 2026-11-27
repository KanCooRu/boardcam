ALTER TABLE player_rankings ADD COLUMN current_power DOUBLE PRECISION CHECK(current_power > 0);
