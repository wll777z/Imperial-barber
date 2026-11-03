import {notFound} from 'next/navigation';
import Management from '@/features/booking/management';
export const metadata={title:'Minha reserva | Imperial Barber',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{token:string}>}){const{token}=await params;if(!/^[a-f0-9]{64}$/.test(token))notFound();return <Management token={token}/>;}
