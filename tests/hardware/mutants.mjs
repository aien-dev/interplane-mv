import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const source=fs.readFileSync('omega/hardware/map.om','utf8');
const mutants=[
 ['discovery-binding','if ne get r add i 32 get d add i 32\nret 24\nend',''],
 ['dma-isolation','if ne get d 14 3\nret 28\nend',''],
 ['timer-range','gt val 2147483647','gt val 18446744073709551615'],
 ['coherency','if and eq get d 14 0 eq get d 15 2\nret 25\nend',''],
 ['vendor','ne get d 7 0','ne uchar 0 0'],
];
const results=[];
for(const [name,from,to] of mutants) {
 assert.equal(source.split(from).length,2,`unique mutant site ${name}`);
 const input=source.replace(from,to);
 const p='target/L558/mutant-'+name;
 fs.writeFileSync(p+'.om',input);
 const c=spawnSync('quiet-build',['target/L558/omc'],{input,timeout:30000});
 assert.equal(c.status,0,`mutant must compile: ${name} ${c.stderr}`);
 assert.equal(c.stdout.subarray(0,4).toString('hex'),'7f454c46');
 fs.writeFileSync(p,c.stdout,{mode:0o755});
 const test=spawnSync('node',['tests/hardware/acceptance.mjs',process.cwd()+'/'+p],{env:{...process.env,HW_EVIDENCE:process.cwd()+'/target/L558/mutant-evidence-'+name},timeout:30000});
 fs.writeFileSync(`qualification/evidence/L558/mutant-${name}.log`,test.stdout.toString()+test.stderr.toString());
 assert.equal(test.status,1,`behavior suite must reject compiled ${name}`);
 assert.match(test.stderr.toString(),/AssertionError/);
 results.push({name,compile_exit:c.status,behavior_exit:test.status,source_sha256:createHash('sha256').update(input).digest('hex'),executable_sha256:createHash('sha256').update(c.stdout).digest('hex')});
}
fs.writeFileSync('qualification/evidence/L558/mutants.json',JSON.stringify(results,null,2)+'\n');
console.log(`PASS ${results.length} compiled mutants detected`);
