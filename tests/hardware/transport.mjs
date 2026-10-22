import fs from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {intent,discovery} from './fixtures.mjs';
const exe=process.cwd()+'/target/L558/hardware-map';
const rows=[];
async function fragmented(name,parts,expected) {
 const c=spawn(exe,[],{stdio:['pipe','pipe','pipe','pipe']});
 let out=Buffer.alloc(0),err=Buffer.alloc(0);
 c.stdout.on('data',b=>out=Buffer.concat([out,b]));c.stderr.on('data',b=>err=Buffer.concat([err,b]));
 c.stdin.on('error',e=>{if(e.code!=='EPIPE')throw e;});c.stdio[3].on('error',e=>{if(e.code!=='EPIPE')throw e;});
 const result=new Promise((resolve,reject)=>{c.on('error',reject);c.on('close',(code,signal)=>resolve({code,signal}));});
 const timer=setTimeout(()=>c.kill('SIGKILL'),3000);
 const r=intent(4),d=discovery();
 for(let i=0;i<96;i+=parts){c.stdin.write(r.subarray(i,i+parts));c.stdio[3].write(d.subarray(i,i+parts));await new Promise(ok=>setImmediate(ok));}
 c.stdin.end();c.stdio[3].end();
 const status=await result;clearTimeout(timer);assert.equal(status.code,expected,err.toString());assert.equal(status.signal,null);
 assert.equal(JSON.parse(out).capability,'hw_dma_map');assert.equal(err.length,0);
 rows.push({name,exit:status.code,stdout_bytes:out.length});
}
for(const size of [1,2,7,31])await fragmented('fragmented-'+size,size,0);
const path='target/L558/discovery.bin';fs.writeFileSync(path,discovery());
let fd=fs.openSync(path,'r');
const run=(name,args,expected)=>{const x=spawnSync(args[0],args.slice(1),{input:intent(),stdio:['pipe','pipe','pipe',fd],timeout:3000});assert.equal(x.error,undefined);assert.equal(x.status,expected,x.stderr?.toString());rows.push({name,exit:x.status,stdout_bytes:x.stdout.length});return x;};
// Absence of host channel cannot be repaired with model bytes.
const nohost=spawnSync(exe,[],{input:intent(),timeout:3000});assert.equal(nohost.status,20);assert.equal(nohost.stdout.length,0);rows.push({name:'missing-trusted-channel',exit:nohost.status});
fs.closeSync(fd);fd=fs.openSync(path,'r');
// Inject failures into this child only. No signal or syscall reaches any other process.
run('stdin-EINTR',['strace','-qq','-o','target/L558/eintr.trace','-e','inject=read:error=EINTR:when=1',exe],0);
fs.closeSync(fd);fd=fs.openSync(path,'r');
run('stdin-EIO',['strace','-qq','-o','target/L558/eio.trace','-e','inject=read:error=EIO:when=1',exe],20);
fs.closeSync(fd);fd=fs.openSync(path,'r');
run('stdout-EIO',['strace','-qq','-o','target/L558/write-eio.trace','-e','inject=write:error=EIO:when=1',exe],29);
fs.closeSync(fd);fd=fs.openSync(path,'r');
run('normal-syscall-trace',['strace','-qq','-o','qualification/evidence/L558/native-syscalls.log',exe],0);
fs.closeSync(fd);
const trace=fs.readFileSync('qualification/evidence/L558/native-syscalls.log','utf8');
const syscalls=[...trace.matchAll(/^([a-z0-9_]+)\(/gm)].map(m=>m[1]);
assert(syscalls.every(s=>['execve','read','write','exit'].includes(s)),syscalls.join(','));
fs.writeFileSync('qualification/evidence/L558/transport.json',JSON.stringify({cases:rows,observed_syscalls:[...new Set(syscalls)]},null,2)+'\n');
console.log(`PASS ${rows.length} native transport/fault checks`);
