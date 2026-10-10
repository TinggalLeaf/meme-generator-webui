import { NextRequest } from "next/server";
import { proxyToMeme } from "@/lib/server-proxy";

export async function GET(req: NextRequest) {
  return proxyToMeme(req);
}

export async function POST(req: NextRequest) {
  return proxyToMeme(req);
}
