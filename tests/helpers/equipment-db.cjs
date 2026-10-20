const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
// Exercise the actual SQL and transactions through D1's small statement API.
module.exports=function database(){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(__dirname,'../../cloudflare/schema.sql'),'utf8'));
 db.exec("INSERT INTO characters(id,name) VALUES('1','Ruin'),('2','Mion')");
 const env={DB:{prepare(sql){let args=[];const statement={bind(...values){args=values;return statement;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};return statement;},async batch(statements){db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());db.exec('COMMIT');return results;}catch(error){db.exec('ROLLBACK');throw error;}}}};
 const add=(id,name,character='1',qty=1)=>db.prepare('INSERT INTO inventory_items(id,character_id,name,quantity) VALUES(?,?,?,?)').run(id,character,name,qty);
 return {db,env,add};
};
