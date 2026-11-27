CREATE TABLE chat_blocks (
 owner TEXT NOT NULL REFERENCES nicknames(owner),
 blocked TEXT NOT NULL REFERENCES nicknames(owner),
 PRIMARY KEY(owner,blocked), CHECK(owner<>blocked)
);
CREATE TABLE chat_reports (
 message_id BIGINT NOT NULL REFERENCES chat_messages(id),
 reporter TEXT NOT NULL REFERENCES nicknames(owner),
 reason TEXT NOT NULL, created_at BIGINT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 PRIMARY KEY(message_id,reporter)
);
CREATE INDEX chat_reports_pending ON chat_reports(status,created_at);
CREATE TABLE world_boss_runs (
 id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES nicknames(owner),
 day BIGINT NOT NULL, started BIGINT NOT NULL, seed BIGINT NOT NULL, snapshot TEXT NOT NULL, damage DOUBLE PRECISION
);
CREATE INDEX world_boss_attempts ON world_boss_runs(owner,day,started);
CREATE TABLE world_boss_bests (
 owner TEXT PRIMARY KEY NOT NULL REFERENCES nicknames(owner),
 damage DOUBLE PRECISION NOT NULL, achieved BIGINT NOT NULL
);
CREATE INDEX world_boss_places ON world_boss_bests(damage DESC,achieved);
ALTER TABLE chat_guilds ADD COLUMN notice TEXT NOT NULL DEFAULT '';
CREATE TABLE arena_results (
 owner TEXT NOT NULL REFERENCES nicknames(owner), id TEXT NOT NULL,
 opponent TEXT NOT NULL REFERENCES nicknames(owner), at BIGINT NOT NULL, result TEXT NOT NULL,
 PRIMARY KEY(owner,id)
);
CREATE INDEX arena_recent ON arena_results(owner,at);
