import {test,expect} from '@playwright/test';
test('unconfigured backend cannot create or expose reservations',async({request,page})=>{
 const r=await request.post('/api/bookings',{headers:{origin:'http://127.0.0.1:3000'},data:{serviceId:'11111111-1111-4111-8111-111111111111',professionalId:null,startsAt:'2026-11-04T15:00:00-03:00',customer:{name:'Teste',phone:'11999998888'},consent:true}});expect(r.status()).toBe(503);expect((await r.json()).ok).toBe(false);
 await page.goto('/agendamento/'+'b'.repeat(64));await expect(page.getByRole('main').getByRole('alert')).toContainText(/indisponível/i);
});
