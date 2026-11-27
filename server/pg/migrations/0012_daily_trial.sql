ALTER TABLE player_action_receipts ADD COLUMN operation_id TEXT;
CREATE TABLE trial_runs (
 run_id TEXT PRIMARY KEY,
 owner TEXT NOT NULL REFERENCES nicknames(owner),
 day_key TEXT NOT NULL,
 week_key TEXT NOT NULL,
 attempt BIGINT NOT NULL CHECK(attempt BETWEEN 1 AND 3),
 started_at BIGINT NOT NULL,
 finished_at BIGINT,
 score DOUBLE PRECISION,
 floors BIGINT,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','ranked','unranked','forfeit')),
 UNIQUE(owner,day_key,attempt)
);
CREATE TABLE trial_weekly (
 owner TEXT NOT NULL REFERENCES nicknames(owner),
 week_key TEXT NOT NULL,
 best_score DOUBLE PRECISION NOT NULL,
 best_floors BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 PRIMARY KEY(owner,week_key)
);
CREATE INDEX trial_weekly_board ON trial_weekly(week_key,best_score DESC,updated_at,owner);
CREATE TABLE trial_rewards (
 owner TEXT NOT NULL REFERENCES nicknames(owner),
 week_key TEXT NOT NULL,
 rank BIGINT NOT NULL,
 claimed_at BIGINT NOT NULL,
 PRIMARY KEY(owner,week_key)
);
