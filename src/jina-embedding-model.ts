import {
  type EmbeddingModelV1,
  TooManyEmbeddingValuesForCallError,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  type FetchFunction,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';

import type {
  JinaEmbeddingModelId,
  JinaEmbeddingSettings,
} from '@/jina-embedding-settings';
import { voyageFailedResponseHandler } from '@/jina-error';

type JinaEmbeddingConfig = {
  provider: string;
  baseURL: string;
  headers: () => Record<string, string | undefined>;
  fetch?: FetchFunction;
};

export type TextEmbeddingInput = string;

export type MultimodalEmbeddingInput = {
  text?: string;
  image?: string;
};

export class JinaEmbeddingModel<T> implements EmbeddingModelV1<T> {
  readonly specificationVersion = 'v1' as const;
  readonly modelId: JinaEmbeddingModelId;

  private readonly config: JinaEmbeddingConfig;
  private readonly settings: JinaEmbeddingSettings;

  get provider(): string {
    return this.config.provider;
  }

  get maxEmbeddingsPerCall(): number {
    return 128;
  }

  get supportsParallelCalls(): boolean {
    return false;
  }

  constructor(
    modelId: JinaEmbeddingModelId,
    settings: JinaEmbeddingSettings,
    config: JinaEmbeddingConfig,
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  async doEmbed({
    values,
    headers,
    abortSignal,
  }: Parameters<EmbeddingModelV1<T>['doEmbed']>[0]): Promise<
    Awaited<ReturnType<EmbeddingModelV1<T>['doEmbed']>>
  > {
    if (values.length > this.maxEmbeddingsPerCall) {
      throw new TooManyEmbeddingValuesForCallError({
        maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
        modelId: this.modelId,
        provider: this.provider,
        values,
      });
    }

    const { responseHeaders, value: response } = await postJsonToApi({
      abortSignal,
      body: {
        model: this.modelId,
        input: values,
        task: this.settings.inputType,
        embedding_type: this.settings.embeddingType,
        dimensions: this.settings.outputDimension,
        normalized: this.settings.normalized ?? true,
        late_chunking: this.settings.lateChunking,
        truncate: this.settings.truncate ?? false,
      },
      failedResponseHandler: voyageFailedResponseHandler,
      fetch: this.config.fetch,
      headers: combineHeaders(this.config.headers(), headers),
      successfulResponseHandler: createJsonResponseHandler(
        jinaEmbeddingResponseSchema,
      ),
      url: `${this.config.baseURL}/embeddings`,
    });

    return {
      embeddings: response.data.map((item) => item.embedding),
      usage: response.usage
        ? { tokens: response.usage.total_tokens }
        : undefined,
      rawResponse: { headers: responseHeaders },
    };
  }
}

const jinaEmbeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      object: z.literal('embedding'),
      embedding: z.array(z.number()),
      index: z.number().optional(),
    }),
  ),
  usage: z
    .object({
      total_tokens: z.number(),
      prompt_tokens: z.number().optional(),
    })
    .nullish(),
  model: z.string().optional(),
});
