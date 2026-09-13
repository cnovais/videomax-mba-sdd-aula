import { notFound } from "next/navigation";
import { backendFetch } from "@/lib/backend-client";
import { getSessionToken } from "@/lib/session";
import { AdminNav } from "@/components/admin-nav";
export default async function AdminLayout({children}:{children:React.ReactNode}) { const token=await getSessionToken(); if(!token) notFound(); const res=await backendFetch("/auth/me",{},token); if(!res.ok) notFound(); const user=await res.json() as {isAdmin?:boolean}; if(!user.isAdmin) notFound(); return <><AdminNav/><main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main></>; }
