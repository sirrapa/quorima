// Quorima — LLM-provider laag (ports/adapters).
//
// De CFO-agent praat tegen een vendor-onafhankelijke LlmPort. Zo draait de
// daily flash op Hermes op OpenAI/Codex (default) zonder Claude-credits te
// verbranden, terwijl je via env kunt wisselen naar Gemini (gratis tier) of
// Anthropic. Kiezen via env QUORIMA_LLM_PROVIDER (default: openai).
//
// Alle adapters gebruiken fetch tegen de REST-API — geen SDK-dependencies.

export interface LlmRequest {
  system: string;
  user: string;
  maxTokens: number;
}

export interface LlmUsage {
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface LlmResult {
  text: string;
  usage: LlmUsage;
  provider: string;
  model: string;
}

export interface LlmPort {
  readonly provider: string;
  readonly model: string;
  complete(req: LlmRequest): Promise<LlmResult>;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Ontbrekende env: ${key}`);
  return v;
}

// ─── Gemini (Google Generative Language API) ────────────────────────────

class GeminiLlm implements LlmPort {
  readonly provider = "gemini";
  readonly model = process.env.QUORIMA_MODEL_CFO ?? "gemini-2.5-flash";

  async complete(req: LlmRequest): Promise<LlmResult> {
    const key = process.env.GEMINI_API_KEY ?? requireEnv("GOOGLE_API_KEY");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.user }] }],
        generationConfig: { maxOutputTokens: req.maxTokens, temperature: 0.4 },
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
    const data = JSON.parse(text) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const out = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    return {
      text: out,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount ?? null,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      },
      provider: this.provider,
      model: this.model,
    };
  }
}

// ─── OpenAI (Chat Completions; "Codex"/GPT) ─────────────────────────────

class OpenAiLlm implements LlmPort {
  readonly provider = "openai";
  readonly model = process.env.QUORIMA_MODEL_CFO ?? "gpt-4o-mini";

  async complete(req: LlmRequest): Promise<LlmResult> {
    const key = requireEnv("OPENAI_API_KEY");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens,
        temperature: 0.4,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
    const data = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? null,
        outputTokens: data.usage?.completion_tokens ?? null,
      },
      provider: this.provider,
      model: this.model,
    };
  }
}

// ─── Anthropic (Claude; optioneel, voor lokaal/dev) ─────────────────────

class AnthropicLlm implements LlmPort {
  readonly provider = "anthropic";
  readonly model = process.env.QUORIMA_MODEL_CFO ?? "claude-opus-4-8";

  async complete(req: LlmRequest): Promise<LlmResult> {
    const key = requireEnv("ANTHROPIC_API_KEY");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: "user", content: req.user }],
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${text.slice(0, 300)}`);
    const data = JSON.parse(text) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const out = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n\n");
    return {
      text: out,
      usage: {
        inputTokens: data.usage?.input_tokens ?? null,
        outputTokens: data.usage?.output_tokens ?? null,
      },
      provider: this.provider,
      model: this.model,
    };
  }
}

/** Selecteer de LLM-provider op basis van env QUORIMA_LLM_PROVIDER (default openai/codex). */
export function createLlm(): LlmPort {
  const provider = (process.env.QUORIMA_LLM_PROVIDER ?? "openai").toLowerCase();
  switch (provider) {
    case "gemini":
    case "google":
      return new GeminiLlm();
    case "openai":
    case "codex":
      return new OpenAiLlm();
    case "anthropic":
    case "claude":
      return new AnthropicLlm();
    default:
      throw new Error(`Onbekende QUORIMA_LLM_PROVIDER "${provider}" (gebruik gemini|openai|anthropic)`);
  }
}
