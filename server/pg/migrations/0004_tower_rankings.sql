ALTER TABLE player_rankings ADD COLUMN tower BIGINT NOT NULL DEFAULT 0 CHECK(tower >= 0);
CREATE INDEX player_rankings_tower ON player_rankings(tower DESC) WHERE tower > 0;
