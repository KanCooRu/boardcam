CREATE TABLE account_backups (
 owner TEXT NOT NULL,
 revision BIGINT NOT NULL,
 request_id TEXT NOT NULL,
 updated_at BIGINT NOT NULL,
 snapshot TEXT NOT NULL,
 PRIMARY KEY(owner, revision),
 UNIQUE(owner, request_id)
);
