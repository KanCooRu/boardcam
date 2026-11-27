ALTER TABLE player_saves ADD COLUMN upload_hash TEXT;
CREATE TABLE player_action_receipts (
 owner TEXT NOT NULL REFERENCES nicknames(owner),
 request_id TEXT NOT NULL,
 command TEXT NOT NULL,
 revision BIGINT NOT NULL,
 result TEXT NOT NULL,
 PRIMARY KEY(owner,request_id)
);
