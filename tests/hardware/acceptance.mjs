import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../../', import.meta.url).pathname;
const executable = process.argv[2] || root + 'target/L558/hardware-map';
const outdir = process.env.HW_EVIDENCE || root + 'qualification/evidence/L558';
fs.mkdirSync(outdir, {recursive:true});
import {discovery,intent,digest,names} from './fixtures.mjs';
const rows=[];
function run(name,r,d,code) {
 const p=outdir+'/discovery.bin'; fs.writeFileSync(p,d);
 const fd=fs.openSync(p,'r');
 const x=spawnSync(executable,[],{input:r,stdio:['pipe','pipe','pipe',fd],timeout:3000}); fs.closeSync(fd);
 assert.equal(x.error,undefined,`${name}: ${x.error}`);
 assert.equal(x.status,code,`${name}: stderr=${x.stderr} stdout=${x.stdout}`);
 if(code) {assert.equal(x.stdout.length,0,name); assert.equal(x.stderr.toString(),`hardware refusal ${code}\n`,name);}
 else {
 const result=JSON.parse(x.stdout);
 const op=r[5];
 assert.deepEqual(result, {kind:'capability_request',request_id:'hw-'+r.readBigUInt64LE(64),runtime:'aienux',capability:'hw_'+names[op-1].replaceAll('.','_'),arguments:{identifier:r.readUInt32LE(12),required_features:r[9],value:Number(r.readBigUInt64LE(16)),discovery_generation:r.readBigUInt64LE(24).toString()},tool:{namespace:'hardware',name:names[op-1]},mapping:{table_version:'hardware-1',rule_id:'alias:hardware.'+names[op-1],passthrough:false,catalog_digest:'sha256:'+digest.toString('hex')}});
 if(name.startsWith('valid-')) fs.writeFileSync(outdir+`/mapped-${op}.json`,JSON.stringify(result)+'\n');
 }
 rows.push({name,exit:x.status,stdout_sha256:createHash('sha256').update(x.stdout).digest('hex'),stderr:x.stderr.toString()});
}
function test(name,code,change=()=>{},op=1) {const r=intent(op),d=discovery(); change(r,d);run(name,r,d,code);}
for(let op=1;op<=5;op++)test('valid-'+names[op-1],0,()=>{},op);
test('unsupported-wire-version',21,r=>r[4]=2);
test('unsupported-discovery-version',21,(_,d)=>d[4]=2);
for(const [name,offset] of [['profile',5],['profile-version',6],['vendor',7]])test('unsupported-'+name,22,(_,d)=>d[offset]=255);
for(const [name,ri,di] of [['isa',6,8],['endianness',7,9],['granule',8,10]]) {
 test('incompatible-'+name,23,r=>r[ri]=2);
 test('unsupported-host-'+name,23,(_,d)=>d[di]=2);
}
test('required-cpu-feature-present',0,r=>r[9]=1);
test('unknown-cpu-features',23,r=>r[9]=128);
test('required-cpu-feature-absent',23,(r,d)=>{r[9]=1;d[11]=0;});
test('unknown-host-feature',23,(_,d)=>d[11]=128);
test('stale-generation',24,r=>r.writeBigUInt64LE(6n,24));
test('future-generation',24,r=>r.writeBigUInt64LE(8n,24));
test('zero-host-generation',24,(_,d)=>d.writeBigUInt64LE(0n,24));
test('forged-catalog-digest',24,r=>r[32]^=1);
test('zero-host-digest',24,(_,d)=>d.fill(0,32,64));
test('unknown-timer',25,(_,d)=>d[12]=0);
test('unknown-gic',25,(_,d)=>d[13]=2);
test('unknown-iommu',25,(_,d)=>d[14]=2);
test('unknown-coherency',25,(_,d)=>d[15]=0);
test('contradictory-coherency',25,(_,d)=>{d[14]=0;d[15]=2;});
test('unknown-firmware',25,(_,d)=>d[16]=255);
test('unknown-conduit',25,(_,d)=>d[17]=0);
test('raw-mmio-refused',26,r=>r[5]=6);
test('unknown-capability',26,r=>r[5]=255);
test('cpu-out-of-range-id',27,r=>r.writeUInt32LE(1,12));
test('interrupt-sgi-refused',27,r=>r.writeUInt32LE(15,12),3);
test('interrupt-reserved-refused',27,r=>r.writeUInt32LE(1020,12),3);
test('identifier-u32-max',27,r=>r.writeUInt32LE(0xffffffff,12),3);
test('timer-zero',27,r=>r.writeBigUInt64LE(0n,16),2);
test('timer-overflow',27,r=>r.writeBigUInt64LE(1n<<63n,16),2);
test('dma-no-isolation',28,(_,d)=>{d[14]=0;d[15]=1;},4);
test('dma-zero-length',27,r=>r.writeBigUInt64LE(0n,16),4);
test('dma-unaligned',27,r=>r.writeBigUInt64LE(4097n,16),4);
test('dma-over-limit',27,r=>r.writeBigUInt64LE(1048577n,16),4);
test('dma-aligned-over-limit',27,r=>r.writeBigUInt64LE(1052672n,16),4);
test('dma-u64-max',27,r=>r.writeBigUInt64LE((1n<<64n)-1n,16),4);
test('dma-identifier-out-of-range',27,r=>r.writeUInt32LE(65536,12),4);
test('no-raw-power-address',27,r=>r.writeBigUInt64LE(0xffffffffffffffffn,16),5);
test('unknown-power-function',27,r=>r.writeUInt32LE(3,12),5);
test('zero-request-id',27,r=>r.writeBigUInt64LE(0n,64));
test('generation-u64-max',0,(r,d)=>{r.writeBigUInt64LE((1n<<64n)-1n,24);d.writeBigUInt64LE((1n<<64n)-1n,24);});
test('request-id-u64-max',0,r=>r.writeBigUInt64LE((1n<<64n)-1n,64));
test('noncoherent-dma-explicit',0,(_,d)=>d[15]=1,4);
test('hvc-and-smc',0,(_,d)=>d[17]=1,5);
test('dma-max-length',0,r=>r.writeBigUInt64LE(1048576n,16),4);
test('interrupt-upper-bound',0,r=>r.writeUInt32LE(1019,12),3);
for(const n of [0,1,4,24,64,95])run('truncated-intent-'+n,intent().subarray(0,n),discovery(),20);
for(const n of [0,1,24,64,95])run('truncated-discovery-'+n,intent(),discovery().subarray(0,n),20);
run('trailing-intent',Buffer.concat([intent(),Buffer.from([0])]),discovery(),20);
run('trailing-discovery',intent(),Buffer.concat([discovery(),Buffer.from([0])]),20);
run('model-forged-discovery-on-stdin',discovery(),Buffer.alloc(0),20);
for(const i of [10,11,72,95])test('intent-reserved-'+i,20,r=>r[i]=1);
for(const i of [18,23,64,95])test('discovery-reserved-'+i,20,(_,d)=>d[i]=1);
// Exhaust every enum spelling against this profile's closed sets.
for(const [field,offset,allowed,code] of [
 ['profile',5,[1],22],['profile-version',6,[1],22],['vendor',7,[0],22],
 ['isa',8,[1],23],['endian',9,[1],23],['granule',10,[1],23],
 ['features',11,[0,1],23],['timer',12,[1],25],['gic',13,[3],25],
 ['iommu',14,[3],25],['coherency',15,[1,2],25],['firmware',16,[1],25],['conduit',17,[1,2],25]
]) for(let value=0;value<256;value++) test('closed-'+field+'-'+value,allowed.includes(value)?0:code,(_,d)=>d[offset]=value);
for(let i=72;i<96;i++)test('reserved-intent-byte-'+i,20,r=>r[i]=1);
for(let i=64;i<96;i++)test('reserved-discovery-byte-'+i,20,(_,d)=>d[i]=1);
fs.writeFileSync(outdir+'/acceptance.json',JSON.stringify({executable_sha256:createHash('sha256').update(fs.readFileSync(executable)).digest('hex'),source_sha256:createHash('sha256').update(fs.readFileSync(root+'omega/hardware/map.om')).digest('hex'),cases:rows},null,2)+'\n');
console.log(`PASS ${rows.length} native behavior cases`);
