CREATE TABLE player_saves (
 owner TEXT PRIMARY KEY REFERENCES nicknames(owner),
 revision BIGINT NOT NULL,
 data TEXT NOT NULL,
 updated_at BIGINT NOT NULL
);
CREATE TABLE player_save_history (
 owner TEXT NOT NULL,
 revision BIGINT NOT NULL,
 data TEXT NOT NULL,
 saved_at BIGINT NOT NULL,
 PRIMARY KEY(owner,revision)
);
