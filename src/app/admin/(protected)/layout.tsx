import {redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import Shell from '@/features/admin/shell';
export const dynamic='force-dynamic';
export const metadata={title:'Painel | Imperial Barber',robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){let email='';try{const admin=await requireAdmin();email=admin.email||'';}catch{redirect('/admin/login');}return <Shell email={email}>{children}</Shell>;}
