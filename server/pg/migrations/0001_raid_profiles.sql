CREATE TABLE raid_profiles (
 owner TEXT PRIMARY KEY NOT NULL REFERENCES nicknames(owner),
 level BIGINT NOT NULL,
 job TEXT NOT NULL,
 outfit TEXT NOT NULL,
 weapon BIGINT NOT NULL,
 portrait BIGINT NOT NULL
);
CREATE INDEX raid_profiles_level ON raid_profiles(level);
