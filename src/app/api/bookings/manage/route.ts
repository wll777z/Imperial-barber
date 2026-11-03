import {ok,errorResponse,readJson,sameOrigin} from '@/lib/api';
import {manageSchema} from '@/lib/validation';
import {limitRequest,rpc,hashToken} from '@/lib/booking-service';
export async function POST(r:Request){try{sameOrigin(r);const p=manageSchema.parse(await readJson(r));await limitRequest(r,'manage',30);if(p.action==='slots')return ok(await rpc('list_booking_slots',{p_token_hash:hashToken(p.token),p_date:p.date}));return ok(await rpc('manage_booking',{p_token_hash:hashToken(p.token),p_action:p.action,p_starts_at:p.startsAt||null}));}catch(e){return errorResponse(e);}}
