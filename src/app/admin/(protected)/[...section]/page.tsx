import {notFound} from 'next/navigation';
import AdminWorkspace from '@/features/admin/workspace';
export default async function Page({params}:{params:Promise<{section:string[]}>}){const{section}=await params;if(section.length!==1||!['agenda','clientes','servicos','equipe','disponibilidade','conteudo','configuracoes'].includes(section[0]))notFound();return <AdminWorkspace section={section[0]}/>;}
