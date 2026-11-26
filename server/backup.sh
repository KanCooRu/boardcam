#!/usr/bin/env bash
# Nightly copy of the game database. Keeps the last seven.
set -euo pipefail
DATA_DIR="${NEBULA_DATA:-/var/lib/nebula}"
NODE="${NEBULA_NODE:-/opt/nebula/node/bin/node}"
[ -f "$DATA_DIR/game.sqlite" ] || exit 0
OUT="$DATA_DIR/backup/game-$(date +%Y%m%d-%H%M).sqlite"
# VACUUM INTO writes a consistent copy even while the game is running.
NEBULA_FROM="$DATA_DIR/game.sqlite" NEBULA_TO="$OUT" "$NODE" --no-warnings -e '
const {DatabaseSync}=require("node:sqlite");
const db=new DatabaseSync(process.env.NEBULA_FROM);
db.exec("VACUUM INTO \x27"+process.env.NEBULA_TO.replace(/\x27/g,"")+"\x27");db.close();'
ls -1t "$DATA_DIR"/backup/game-*.sqlite | tail -n +8 | xargs -r rm -f
