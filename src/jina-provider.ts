import type {
  EmbeddingModelV1,
  LanguageModelV1,
  ProviderV1,
} from '@ai-sdk/provider';
import {
  type FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
import {
  JinaEmbeddingModel,
  type MultimodalEmbeddingInput,
  type TextEmbeddingInput,
} from './jina-embedding-model';
import type {
  JinaEmbeddingModelId,
  JinaEmbeddingSettings,
} from './jina-embedding-settings';

export interface JinaProvider extends ProviderV1 {
  /**
   * Create a text embedding model for string inputs only.
   * This ensures type safety by only allowing string arrays.
   * @param modelId - The Jina model ID
   * @param settings - Optional model settings
   */
  textEmbeddingModel(
    modelId: JinaEmbeddingModelId,
    settings?: JinaEmbeddingSettings,
  ): EmbeddingModelV1<string>;

  /**
   * Create a multimodal embedding model for MultimodalEmbeddingInput only.
   * This ensures type safety by only allowing MultimodalEmbeddingInput arrays.
   * @param modelId - The Jina model ID
   * @param settings - Optional model settings
   */
  multiModalEmbeddingModel(
    modelId: JinaEmbeddingModelId,
    settings?: JinaEmbeddingSettings,
  ): EmbeddingModelV1<MultimodalEmbeddingInput>;
}

export interface JinaProviderSettings {
  /**
   * Use a different URL prefix for API calls, e.g. to use proxy servers.
   * The default prefix is `https://api.jina.ai/v1`.
   */
  baseURL?: string;

  /**
   * API key that is being send using the `Authorization` header.
   * It defaults to the `JINA_API_KEY` environment variable.
   */
  apiKey?: string;

  /**
   * Custom headers to include in the requests.
   */
  headers?: Record<string, string>;

  /**
   * Custom fetch implementation. You can use it as a middleware to intercept requests,
   * or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;
}

export function createJina(options: JinaProviderSettings = {}): JinaProvider {
  const baseURL =
    withoutTrailingSlash(options.baseURL) ?? 'https://api.jina.ai/v1';

  const getHeaders = () => ({
    Authorization: `Bearer ${loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: 'JINA_API_KEY',
      description: 'Jina',
    })}`,
    ...options.headers,
  });

  const createTextEmbeddingModel = (
    modelId: JinaEmbeddingModelId,
    settings: JinaEmbeddingSettings = {},
  ) =>
    new JinaEmbeddingModel<TextEmbeddingInput>(modelId, settings, {
      provider: 'jina.text.embedding',
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createMultiModalEmbeddingModel = (
    modelId: JinaEmbeddingModelId,
    settings: JinaEmbeddingSettings = {},
  ) =>
    new JinaEmbeddingModel<MultimodalEmbeddingInput>(modelId, settings, {
      provider: 'jina.multimodal.embedding',
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const provider = function (
    modelId: JinaEmbeddingModelId,
    settings?: JinaEmbeddingSettings,
  ) {
    if (new.target) {
      throw new Error(
        'The Jina model function cannot be called with the new keyword.',
      );
    }

    return createTextEmbeddingModel(modelId, settings);
  };

  provider.textEmbeddingModel = createTextEmbeddingModel;
  provider.multiModalEmbeddingModel = createMultiModalEmbeddingModel;

  provider.languageModel = (modelId: string): LanguageModelV1 => {
    throw new Error(
      `Language model '${modelId}' is not supported by Jina provider.`,
    );
  };
  return provider as JinaProvider;
}

export const jina = createJina();

export type {
  MultimodalEmbeddingInput,
  JinaEmbeddingModelId,
  JinaEmbeddingSettings,
};
