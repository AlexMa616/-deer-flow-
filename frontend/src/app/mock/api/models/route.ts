export function GET() {
  return Response.json({
    models: [
      {
        id: "gpt-5.4",
        name: "gpt-5.4",
        display_name: "GPT-5.4",
        supports_thinking: true,
        supports_vision: true,
      },
      {
        id: "gpt-5-mini",
        name: "gpt-5-mini",
        display_name: "GPT-5 Mini",
        supports_thinking: true,
        supports_vision: true,
      },
      {
        id: "gpt-5.3-codex",
        name: "gpt-5.3-codex",
        display_name: "Codex 5.3",
        supports_thinking: true,
        supports_vision: false,
      },
      {
        id: "gpt-5.2-codex",
        name: "gpt-5.2-codex",
        display_name: "Codex 5.2",
        supports_thinking: true,
        supports_vision: false,
      },
      {
        id: "gpt-4.1",
        name: "gpt-4.1",
        display_name: "GPT-4.1",
        supports_thinking: true,
        supports_vision: true,
      },
      {
        id: "gpt-4.1-mini",
        name: "gpt-4.1-mini",
        display_name: "GPT-4.1 Mini",
        supports_thinking: true,
        supports_vision: true,
      },
    ],
  });
}
