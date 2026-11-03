import 'server-only';
import {createHash,randomBytes} from 'node:crypto';
import {serviceClient} from './supabase/service';
import {ApiError} from './api';
export const hashToken=(v:string)=>createHash('sha256').update(v).digest('hex');
export async function limitRequest(request:Request,scope:string,max=30,target=''){
 const name=process.env.TRUSTED_IP_HEADER;const identity=name?request.headers.get(name):null;
 // No trusted edge identity: shared fallback is conservative and cannot be bypassed with a forged header.
 const key=hashToken(scope+':'+(identity||'shared')+':'+target);const db=serviceClient();const{data,error}=await db.rpc('consume_limit',{p_key:key,p_limit:max,p_window_seconds:900});if(error)throw error;if(!data)throw new ApiError('RATE_LIMITED');
}
export async function rpc(name:string,args:Record<string,unknown>){const{data,error}=await serviceClient().rpc(name,args);if(error)throw error;return data;}
export const newToken=()=>randomBytes(32).toString('hex');
