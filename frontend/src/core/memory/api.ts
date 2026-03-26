import { requestJSON } from "../api";
import { getBackendBaseURL } from "../config";

import type { UserMemory } from "./types";

export async function loadMemory() {
  return requestJSON<UserMemory>(`${getBackendBaseURL()}/api/memory`);
}
