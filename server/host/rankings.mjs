// The power and stage rankings, answered from a snapshot that is rebuilt at most every RANK_CACHE_SECONDS.
// The game's own handler sorts every player for every request, which is fine for hundreds of players and
// far too slow for hundreds of thousands. The answer has the same shape as the game's; only its age differs.
// The guild ranking is small and still goes to the game's handler.
const BOARDS={power:'power',stage:'stage'};
const LOCK=727002;
export function createRankings(pool,seconds,log){
 const ttl=seconds*1000,known=new Map(),busy=new Map();
 async function refresh(board){
  const column=BOARDS[board],client=await pool.connect();
  try{
   await client.query('BEGIN');
   // Only one process on one server rebuilds at a time; the others keep serving what there is.
   const got=(await client.query('SELECT pg_try_advisory_xact_lock($1,$2) AS ok',[LOCK,board==='power'?1:2])).rows[0].ok;
   if(got){
    const at=(await client.query('SELECT refreshed_at FROM host_rank_meta WHERE board=$1',[board])).rows[0]?.refreshed_at;
    if(at===undefined||Date.now()-at>=ttl){
     await client.query('DELETE FROM host_rank_snapshot WHERE board=$1',[board]);
     await client.query(`INSERT INTO host_rank_snapshot(board,pos,owner,name,score,place,job,outfit,portrait)
      SELECT $1,ROW_NUMBER() OVER (ORDER BY p.${column} DESC,n.name,p.owner),p.owner,n.name,p.${column},
       RANK() OVER (ORDER BY p.${column} DESC),profile.job,profile.outfit,profile.portrait
      FROM ranked_progress p JOIN nicknames n ON n.owner=p.owner LEFT JOIN raid_profiles profile ON profile.owner=p.owner
      WHERE p.${column}>0`,[board]);
     await client.query('INSERT INTO host_rank_meta(board,refreshed_at) VALUES($1,$2) ON CONFLICT(board) DO UPDATE SET refreshed_at=excluded.refreshed_at',[board,Date.now()]);
    }
   }
   await client.query('COMMIT');
   const now=(await client.query('SELECT refreshed_at FROM host_rank_meta WHERE board=$1',[board])).rows[0]?.refreshed_at;
   if(now!==undefined)known.set(board,now);
  }catch(error){
   await client.query('ROLLBACK').catch(()=>{});
   log('[rankings] refresh failed:',error.message);
  }finally{client.release()}
 }
 function keepFresh(board){
  if(busy.has(board))return busy.get(board);
  const work=refresh(board).finally(()=>busy.delete(board));
  busy.set(board,work);return work;
 }
 return {
  // Returns the rows for this player, or null when the game's own handler should answer.
  async rows(board,owner){
   if(!ttl||!Object.hasOwn(BOARDS,board))return null;
   const at=known.get(board);
   if(at===undefined)await keepFresh(board);                     // first use: wait for a snapshot
   else if(Date.now()-at>=ttl)void keepFresh(board);            // stale: rebuild behind the answer
   if(!known.has(board))return null;
   const result=await pool.query(`SELECT name,score,(owner=$2)::int AS mine,place,job,outfit,portrait
    FROM host_rank_snapshot WHERE board=$1 AND (pos<=50 OR owner=$2) ORDER BY pos`,[board,owner]);
   return result.rows;
  }
 };
}
