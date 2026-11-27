This folder is the game's "overlay" when there is nothing to lay over the base archive.
To ship fixes on top of a base archive, put the changed files in a folder at the repository root
(same paths as in the game: dist/..., drizzle/...) and name that folder in docker-compose.yml → api → args → OVERLAY.
