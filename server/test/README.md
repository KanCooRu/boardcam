Checks for the PostgreSQL layer and sign-in.

- `auth.test.mjs` — `node auth.test.mjs`. Firebase ID token and guest cookie checks.
- `record.mjs` + `replay.mjs` — proves that PostgreSQL answers every statement the game's own tests send
  exactly as SQLite does. Run after any change to SQL in the game's `dist/server/*.js`:

      # 1. record the game's tests (in the game folder)
      for t in $(grep -l "DatabaseSync\|save-worker-fixture" tests/*.mjs); do
        NEBULA_RECORD=/tmp/rec/$(basename $t).json node --import <repo>/server/test/record.mjs $t
      done
      # 2. replay on a PostgreSQL where the role may create databases
      PG_ADMIN=postgres://user:pass@127.0.0.1:5432/postgres node replay.mjs <game folder> /tmp/rec/*.json

  It must end with "differences: 0".
