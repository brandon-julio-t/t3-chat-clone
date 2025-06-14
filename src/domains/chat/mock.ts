import { faker } from "@faker-js/faker";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV1 } from "ai/test";

export const getMockModelForGenerateText = () => {
  return new MockLanguageModelV1({
    doGenerate: async () => {
      const n = faker.number.int({ min: 1, max: 3 });
      const loremIpsum = faker.lorem.words(n);

      return {
        rawCall: { rawPrompt: null, rawSettings: {} },
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        text: loremIpsum,
      };
    },
  });
};

export const getMockModelForStreamText = () => {
  return new MockLanguageModelV1({
    doStream: async () => {
      const n = faker.number.int({ min: 1, max: 10 });
      const loremIpsum = faker.lorem.paragraphs(n);

      return {
        stream: simulateReadableStream({
          chunks: [
            ...loremIpsum.split(" ").map((word) => ({
              type: "text-delta" as const,
              textDelta: `${word} `,
            })),
            {
              type: "finish",
              finishReason: "stop",
              logprobs: undefined,
              usage: { completionTokens: 10, promptTokens: 3 },
            },
          ],
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    },
  });
};
