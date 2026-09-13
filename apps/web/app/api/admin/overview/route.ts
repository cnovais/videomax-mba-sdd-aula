import { NextResponse } from "next/server"; import {backendFetch} from "@/lib/backend-client"; import {requireSessionToken} from "@/lib/session";
export async function GET(){const t=await requireSessionToken();if(t instanceof Response)return t;const r=await backendFetch("/admin/overview",{},t);return NextResponse.json(await r.json(),{status:r.status});}
