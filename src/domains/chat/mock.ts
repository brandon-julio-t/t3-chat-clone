import { simulateReadableStream } from "ai";
import { MockLanguageModelV1 } from "ai/test";

export const getMockModelForGenerateText = () => {
  return new MockLanguageModelV1({
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 20 },
      text: `Hello, world!`,
    }),
  });
};

export const getMockModelForStreamText = () => {
  return new MockLanguageModelV1({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-delta", textDelta: "Hello" },
          { type: "text-delta", textDelta: ", " },
          { type: "text-delta", textDelta: `world!` },
          {
            type: "finish",
            finishReason: "stop",
            logprobs: undefined,
            usage: { completionTokens: 10, promptTokens: 3 },
          },
        ],
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    }),
  });
};
