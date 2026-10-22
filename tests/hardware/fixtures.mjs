import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url).pathname;
const catalog = JSON.parse(fs.readFileSync(root+'omega/hardware/catalog.json'));
const canonical = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '['+v.map(canonical).join(',')+']' : '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
const schemaDigest = v => 'sha256:'+createHash('sha256').update(canonical(v)).digest('hex');
const pairs=catalog.capabilities.map(c=>[c.name,schemaDigest(c.parameters)]).sort((a,b)=>a[0].localeCompare(b[0], 'en'));
export const digest = createHash('sha256').update(canonical(pairs)).digest();
export const names=['cpu.discover','timer.arm','interrupt.bind','dma.map','power.request'];
export function discovery() {
 const b=Buffer.alloc(96); b.write('HWD1');
 Buffer.from([1,1,1,0,1,1,1,1,1,3,3,2,1,2]).copy(b,4);
 b.writeBigUInt64LE(7n,24); digest.copy(b,32); return b;
}
export function intent(op=1) {
 const b=Buffer.alloc(96); b.write('HWI1'); Buffer.from([1,op,1,1,1,0]).copy(b,4);
 b.writeUInt32LE(op===3?32:op===5?1:0,12);
 b.writeBigUInt64LE(op===2?1n:op===4?4096n:0n,16);
 b.writeBigUInt64LE(7n,24); digest.copy(b,32); b.writeBigUInt64LE(1n,64); return b;
}
