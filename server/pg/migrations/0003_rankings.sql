CREATE TABLE player_rankings (
 owner TEXT PRIMARY KEY NOT NULL REFERENCES nicknames(owner),
 power DOUBLE PRECISION NOT NULL CHECK(power >= 0),
 stage BIGINT NOT NULL CHECK(stage BETWEEN 0 AND 1200)
);
CREATE INDEX player_rankings_power ON player_rankings(power DESC);
CREATE INDEX player_rankings_stage ON player_rankings(stage DESC);
CREATE INDEX chat_members_guild ON chat_members(guild_key);
