import { requestJSON } from "../api";
import { getBackendBaseURL } from "../config";

import type { SystemOverview } from "./types";

export async function fetchSystemOverview() {
  return requestJSON<SystemOverview>(
    `${getBackendBaseURL()}/api/system/overview`,
  );
}
