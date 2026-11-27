CREATE TABLE ranked_progress (
 owner TEXT PRIMARY KEY NOT NULL REFERENCES nicknames(owner),
 job TEXT NOT NULL CHECK (job IN ('warrior','shadow','paladin','mage','archer')),
 power DOUBLE PRECISION NOT NULL CHECK(power>0),
 current_power DOUBLE PRECISION NOT NULL CHECK(current_power>0 AND current_power<=power),
 stage BIGINT NOT NULL DEFAULT 0 CHECK(stage BETWEEN 0 AND 1200),
 tower BIGINT NOT NULL DEFAULT 0 CHECK(tower>=0),
 revision BIGINT NOT NULL DEFAULT 1,
 sheet TEXT NOT NULL,
 proof TEXT,
 last_receipt TEXT,
 last_action_at BIGINT NOT NULL
);
CREATE INDEX ranked_progress_power ON ranked_progress(power DESC);
CREATE INDEX ranked_progress_stage ON ranked_progress(stage DESC) WHERE stage>0;
CREATE INDEX ranked_progress_tower ON ranked_progress(tower DESC) WHERE tower>0;
-- A guild moves to the back of the arrival order whenever a member's current power changes.
CREATE FUNCTION ranked_guild_score_touch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 DELETE FROM guild_power_order WHERE guild_key=(SELECT guild_key FROM chat_members WHERE owner=NEW.owner);
 INSERT INTO guild_power_order(guild_key)
 SELECT guild_key FROM chat_members WHERE owner=NEW.owner AND guild_key IS NOT NULL;
 RETURN NULL;
END $$;
CREATE TRIGGER ranked_guild_score_insert AFTER INSERT ON ranked_progress
 FOR EACH ROW EXECUTE FUNCTION ranked_guild_score_touch();
CREATE TRIGGER ranked_guild_score_update AFTER UPDATE OF current_power ON ranked_progress
 FOR EACH ROW WHEN (NEW.current_power<>OLD.current_power) EXECUTE FUNCTION ranked_guild_score_touch();
