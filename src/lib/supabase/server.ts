import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export function publicConfig(){return {url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY};}
export async function sessionClient(){const {url,key}=publicConfig();if(!url||!key)return null;const jar=await cookies();return createServerClient(url,key,{cookies:{getAll:()=>jar.getAll(),setAll(items){try{for(const {name,value,options}of items)jar.set(name,value,options);}catch{/* Read-only server render; auth mutations run in route handlers. */}}}});}
