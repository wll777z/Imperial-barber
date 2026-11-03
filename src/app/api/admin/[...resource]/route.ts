import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {requireAdmin} from '@/lib/auth';
import {ok,errorResponse,readJson,sameOrigin,ApiError} from '@/lib/api';
import {serviceSchema,professionalSchema,scheduleSchema,settingsSchema,bookingSchema,bookingPatchSchema} from '@/lib/validation';
import {defaultSettings,initialServices} from '@/lib/defaults';
import {validateUpload} from '@/lib/uploads';
import {revalidatePath} from 'next/cache';
type Ctx={params:Promise<{resource:string[]}>};
async function resource(ctx:Ctx){const r=(await ctx.params).resource;if(r.length!==1)throw new ApiError('NOT_FOUND');return r[0];}
function check(error:unknown){if(error)throw error;}
const idSchema=z.uuid();
const pagination=z.coerce.number().int().min(0).max(1000000);
export async function GET(request:Request,ctx:Ctx){try{const{db}=await requireAdmin();const name=await resource(ctx);const q=new URL(request.url).searchParams;
 if(name==='overview'){const{data,error}=await db.rpc('admin_overview');check(error);return ok(data);}
 if(name==='bookings'){const p=z.object({date:z.iso.date().nullable(),pro:z.uuid().nullable(),customer:z.uuid().nullable(),status:z.enum(['confirmed','cancelled','completed','no_show']).nullable(),offset:pagination}).parse({date:q.get('date')||null,pro:q.get('professionalId')||null,customer:q.get('customerId')||null,status:q.get('status')||null,offset:q.get('offset')||0});const {data,error}=await db.rpc('admin_list_bookings',{p_date:p.date,p_pro:p.pro,p_customer:p.customer,p_status:p.status,p_offset:p.offset});check(error);return ok(data);}
 if(name==='customers'){const offset=pagination.parse(q.get('offset')||0);let query=db.from('customers').select('*',{count:'exact'}).order('created_at',{ascending:false}).range(offset,offset+199);const term=(q.get('q')||'').slice(0,100);if(term)query=query.ilike(/^\d+$/.test(term)?'phone':'name',`%${term.replace(/[%_]/g,'')}%`);const{data,error,count}=await query;check(error);return ok({items:data,total:count});}
 if(name==='settings'){const{data,error}=await db.from('site_settings').select('content').single();check(error);return ok({...defaultSettings,...data?.content});}
 if(name==='schedule'){const id=idSchema.parse(q.get('professionalId'));const[h,b]=await Promise.all([db.from('working_hours').select('*').eq('professional_id',id),db.from('schedule_blocks').select('*').eq('professional_id',id).order('starts_at')]);check(h.error||b.error);return ok({hours:(h.data||[]).map(x=>({weekday:x.weekday,start:x.opens.slice(0,5),end:x.closes.slice(0,5)})),blocks:(b.data||[]).map(x=>({startsAt:x.starts_at,endsAt:x.ends_at,reason:x.reason}))});}
 if(name==='services'){const{data,error}=await db.from('services').select('*').order('sort_order');check(error);return ok(data);}
 if(name==='professionals'){const[p,l]=await Promise.all([db.from('professionals').select('*').order('sort_order'),db.from('professional_services').select('*')]);check(p.error||l.error);return ok((p.data||[]).map(x=>({...x,serviceIds:(l.data||[]).filter(y=>y.professional_id===x.id).map(y=>y.service_id)})));}
 throw new ApiError('NOT_FOUND');
 }catch(e){return errorResponse(e);}}
export async function POST(request:Request,ctx:Ctx){try{sameOrigin(request);const{db}=await requireAdmin();const name=await resource(ctx);
 if(name==='upload'){if(Number(request.headers.get('content-length')||0)>5500000)throw new ApiError('VALIDATION');const form=await request.formData();const file=form.get('file');if(!(file instanceof File)||file.size>5242880)throw new ApiError('VALIDATION');const bytes=new Uint8Array(await file.arrayBuffer());const info=validateUpload(bytes,file.type);const path=randomUUID()+'.'+info.extension;const{error}=await db.storage.from('site-images').upload(path,bytes,{contentType:info.mime,upsert:false});check(error);return ok({url:db.storage.from('site-images').getPublicUrl(path).data.publicUrl});}
 const raw=await readJson(request);
 if(name==='initialize'){z.object({}).strict().parse(raw);const existing=await db.from('services').select('id',{count:'exact',head:true});check(existing.error);if(existing.count)throw new ApiError('CONFLICT');const{error}=await db.from('services').insert(initialServices.map(s=>({name:s.name,description:s.description,price_cents:s.priceCents,duration_minutes:s.durationMinutes,image_url:s.imageUrl,sort_order:s.sortOrder})));check(error);return ok(null);}
 if(name==='settings'){const v=settingsSchema.parse(raw);if(v.bookingEnabled){const{count,error}=await db.from('working_hours').select('id',{head:true,count:'exact'});check(error);if(!count)throw new ApiError('VALIDATION');}const{error}=await db.from('site_settings').update({content:v}).eq('id',true);check(error);revalidatePath('/');return ok(null);}
 if(name==='schedule'){const p=scheduleSchema.parse(raw);const{error}=await db.rpc('admin_update_schedule',{p_professional_id:p.professionalId,p_schedule:{hours:p.hours,blocks:p.blocks}});check(error);return ok(null);}
 if(name==='booking-create'){const p=bookingSchema.parse(raw);const{data,error}=await db.rpc('admin_create_booking',{p_input:p});check(error);return ok(data);}
 const body=z.object({id:z.uuid().optional(),data:z.unknown()}).strict().parse(raw);
 if(name==='bookings'){const p=bookingPatchSchema.parse(body.data);if(!body.id)throw new ApiError('VALIDATION');const{data,error}=await db.rpc('admin_update_booking',{p_id:body.id,p_patch:p});check(error);return ok(data);}
 if(name==='services'){const p=serviceSchema.parse(body.data);const row={name:p.name,description:p.description,price_cents:p.priceCents,duration_minutes:p.durationMinutes,image_url:p.imageUrl,active:p.active,sort_order:p.sortOrder};const{error}=body.id?await db.from('services').update(row).eq('id',body.id):await db.from('services').insert(row);check(error);revalidatePath('/');return ok(null);}
 if(name==='professionals'){const p=professionalSchema.parse(body.data);const{error}=await db.rpc('admin_save_professional',{p_id:body.id||null,p_input:p});check(error);revalidatePath('/');return ok(null);}
 throw new ApiError('NOT_FOUND');
 }catch(e){return errorResponse(e);}}
