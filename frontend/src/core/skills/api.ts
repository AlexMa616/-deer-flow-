import { requestJSON } from "@/core/api";
import { getBackendBaseURL } from "@/core/config";

import type { Skill } from "./type";

export async function loadSkills() {
  const json = await requestJSON<{ skills: Skill[] }>(
    `${getBackendBaseURL()}/api/skills`,
  );
  return json.skills;
}

export async function enableSkill(skillName: string, enabled: boolean) {
  return requestJSON<{ success?: boolean; message?: string }>(
    `${getBackendBaseURL()}/api/skills/${skillName}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enabled,
      }),
    },
  );
}

export interface InstallSkillRequest {
  thread_id: string;
  path: string;
}

export interface InstallSkillResponse {
  success: boolean;
  skill_name: string;
  message: string;
}

export async function installSkill(
  request: InstallSkillRequest,
): Promise<InstallSkillResponse> {
  try {
    return await requestJSON<InstallSkillResponse>(
      `${getBackendBaseURL()}/api/skills/install`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );
  } catch (error) {
    return {
      success: false,
      skill_name: "",
      message: error instanceof Error ? error.message : "安装技能失败",
    };
  }
}
