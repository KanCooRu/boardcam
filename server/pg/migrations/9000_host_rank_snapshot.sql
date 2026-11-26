-- Kept by the host, not by the game: the power and stage rankings as they stood at the last refresh.
-- Reading a ranking then costs an index lookup instead of sorting every player on every request.
CREATE TABLE host_rank_snapshot (
 board TEXT NOT NULL,
 pos BIGINT NOT NULL,
 owner TEXT NOT NULL,
 name TEXT NOT NULL,
 score DOUBLE PRECISION,
 place BIGINT,
 job TEXT,
 outfit TEXT,
 portrait BIGINT,
 PRIMARY KEY(board,pos)
);
CREATE UNIQUE INDEX host_rank_snapshot_owner ON host_rank_snapshot(board,owner);
CREATE TABLE host_rank_meta (
 board TEXT PRIMARY KEY,
 refreshed_at BIGINT NOT NULL
);
