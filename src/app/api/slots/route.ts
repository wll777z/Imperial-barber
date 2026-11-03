import {ok,errorResponse} from '@/lib/api';
import {slotSchema} from '@/lib/validation';
import {limitRequest,rpc} from '@/lib/booking-service';
export async function GET(r:Request){try{const q=new URL(r.url).searchParams;const p=slotSchema.parse({serviceId:q.get('serviceId'),professionalId:q.get('professionalId')||null,date:q.get('date')});await limitRequest(r,'slots',120);return ok(await rpc('list_slots',{p_service_id:p.serviceId,p_professional_id:p.professionalId,p_date:p.date}));}catch(e){return errorResponse(e);}}
