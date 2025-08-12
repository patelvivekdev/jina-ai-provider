import {
  type EmbeddingModelV2,
  TooManyEmbeddingValuesForCallError,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  type FetchFunction,
  parseProviderOptions,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

import {
  jinaEmbeddingOptions,
  type JinaEmbeddingModelId,
} from '@/jina-embedding-options';
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

export class JinaEmbeddingModel<T> implements EmbeddingModelV2<T> {
  readonly specificationVersion = 'v2' as const;
  readonly modelId: JinaEmbeddingModelId;

  private readonly config: JinaEmbeddingConfig;

  get provider(): string {
    return this.config.provider;
  }

  get maxEmbeddingsPerCall(): number {
    return 2048;
  }

  get supportsParallelCalls(): boolean {
    return false;
  }

  constructor(modelId: JinaEmbeddingModelId, config: JinaEmbeddingConfig) {
    this.modelId = modelId;
    this.config = config;
  }

  async doEmbed({
    abortSignal,
    values,
    headers,
    providerOptions,
  }: Parameters<EmbeddingModelV2<T>['doEmbed']>[0]): Promise<
    Awaited<ReturnType<EmbeddingModelV2<T>['doEmbed']>>
  > {
    const embeddingOptions = await parseProviderOptions({
      provider: 'jina',
      providerOptions,
      schema: jinaEmbeddingOptions,
    });

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
        task: embeddingOptions?.inputType,
        embedding_type: embeddingOptions?.embeddingType,
        dimensions: embeddingOptions?.outputDimension,
        normalized: embeddingOptions?.normalized ?? true,
        late_chunking: embeddingOptions?.lateChunking,
        truncate: embeddingOptions?.truncate ?? false,
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
      response: { headers: responseHeaders },
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
