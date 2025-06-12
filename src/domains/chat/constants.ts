export const DEFAULT_AI_MODEL = "meta-llama/llama-4-maverick:free";

export const AI_MODELS = [
  {
    label: "Gemini 2.0 Flash",
    value: "google/gemini-2.0-flash-exp:free",
    modalities: ["text", "file", "image"],
  },
  {
    label: "Gemini 2.5 Pro",
    value: "google/gemini-2.5-pro-exp-03-25",
    modalities: ["text", "file", "image"],
  },
  {
    label: "Gemma 3 1B",
    value: "google/gemma-3-1b-it:free",
    modalities: ["text"],
  },
  {
    label: "Gemma 3 12B",
    value: "google/gemma-3-12b-it:free",
    modalities: ["text"],
  },
  {
    label: "Gemma 3 27B",
    value: "google/gemma-3-27b-it:free",
    modalities: ["text"],
  },
  {
    label: "Gemma 3 4B",
    value: "google/gemma-3-4b-it:free",
    modalities: ["text"],
  },
  {
    label: "InternVL3 14B",
    value: "opengvlab/internvl3-14b:free",
    modalities: ["text", "image"],
  },
  {
    label: "InternVL3 2B",
    value: "opengvlab/internvl3-2b:free",
    modalities: ["text", "image"],
  },
  {
    label: "Kimi VL A3B",
    value: "moonshotai/kimi-vl-a3b-thinking:free",
    modalities: ["text", "image"],
  },
  {
    label: "Llama 3.2 Vision",
    value: "meta-llama/llama-3.2-11b-vision-instruct:free",
    modalities: ["text", "image"],
  },
  {
    label: "Llama 4 Maverick",
    value: "meta-llama/llama-4-maverick:free",
    modalities: ["text", "file", "image"],
  },
  {
    label: "Llama 4 Scout",
    value: "meta-llama/llama-4-scout:free",
    modalities: ["text"],
  },
  {
    label: "Mistral Small 3.1",
    value: "mistralai/mistral-small-3.1-24b-instruct:free",
    modalities: ["text"],
  },
  {
    label: "Qwen 2.5 VL 3B",
    value: "qwen/qwen2.5-vl-3b-instruct:free",
    modalities: ["text", "image"],
  },
  {
    label: "Qwen 2.5 VL 32B",
    value: "qwen/qwen2.5-vl-32b-instruct:free",
    modalities: ["text", "image"],
  },
  {
    label: "Qwen 2.5 VL 72B",
    value: "qwen/qwen2.5-vl-72b-instruct:free",
    modalities: ["text", "image"],
  },
  {
    label: "Qwen 2.5 VL 7B",
    value: "qwen/qwen-2.5-vl-7b-instruct:free",
    modalities: ["text", "image"],
  },
] satisfies Array<{
  label: string;
  value: string;
  modalities: Array<"text" | "file" | "image">;
}>;
