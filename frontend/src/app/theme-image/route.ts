import { type NextRequest } from "next/server";

import { GET as handleThemeImage } from "../api/theme-image/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleThemeImage(request);
}
