// Reads CLI-generated LOCAL credentials without writing them to console.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const dir='.superpowers/local';mkdirSync(dir,{recursive:true});
const raw=execFileSync('node_modules/.bin/supabase',['status','--output','env'],{env:{...process.env,SUPABASE_HOME:process.cwd()+'/.superpowers/supabase'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
const vars={};for(const line of raw.split('\n')){const m=line.match(/^([A-Z_]+)="(.*)"$/);if(m)vars[m[1]]=m[2];}
const url=vars.API_URL;if(!url||!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)||!vars.ANON_KEY||!vars.SERVICE_ROLE_KEY)throw Error('Local Supabase status did not provide required bindings');
if(existsSync('.env.local')&&!readFileSync('.env.local','utf8').startsWith('# LOCAL DEVELOPMENT ONLY'))throw Error('Preserving existing .env.local; configure local test variables separately');
writeFileSync('.env.local',`# LOCAL DEVELOPMENT ONLY — generated, never commit\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${vars.ANON_KEY}\nSUPABASE_SERVICE_ROLE_KEY=${vars.SERVICE_ROLE_KEY}\n`,{mode:0o600});console.log('Local environment bindings saved securely (values omitted).');
