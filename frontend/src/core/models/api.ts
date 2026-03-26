import { requestJSON } from "../api";
import { getBackendBaseURL } from "../config";

import type { Model } from "./types";

export async function loadModels() {
  const { models } = await requestJSON<{ models: Model[] }>(
    `${getBackendBaseURL()}/api/models`,
  );
  return models;
}
