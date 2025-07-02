import type {
  EmbeddingModelV2,
  ImageModelV2,
  LanguageModelV2,
  ProviderV2,
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
import type { JinaEmbeddingModelId } from './jina-embedding-options';

export interface JinaProvider extends ProviderV2 {
  /**
   * Create a text embedding model for string inputs only.
   * This ensures type safety by only allowing string arrays.
   * @param modelId - The Jina model ID
   * @param settings - Optional model settings
   */
  textEmbeddingModel(modelId: JinaEmbeddingModelId): EmbeddingModelV2<string>;

  /**
   * Create a multimodal embedding model for MultimodalEmbeddingInput only.
   * This ensures type safety by only allowing MultimodalEmbeddingInput arrays.
   * @param modelId - The Jina model ID
   * @param settings - Optional model settings
   */
  multiModalEmbeddingModel(
    modelId: JinaEmbeddingModelId,
  ): EmbeddingModelV2<MultimodalEmbeddingInput>;
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

  const createTextEmbeddingModel = (modelId: JinaEmbeddingModelId) =>
    new JinaEmbeddingModel<TextEmbeddingInput>(modelId, {
      provider: 'jina.text.embedding',
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createMultiModalEmbeddingModel = (modelId: JinaEmbeddingModelId) =>
    new JinaEmbeddingModel<MultimodalEmbeddingInput>(modelId, {
      provider: 'jina.multimodal.embedding',
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const provider = function (modelId: JinaEmbeddingModelId) {
    if (new.target) {
      throw new Error(
        'The Jina model function cannot be called with the new keyword.',
      );
    }

    return createTextEmbeddingModel(modelId);
  };

  provider.textEmbeddingModel = createTextEmbeddingModel;
  provider.multiModalEmbeddingModel = createMultiModalEmbeddingModel;

  provider.chat = provider.languageModel = (): LanguageModelV2 => {
    throw new Error('languageModel method is not implemented.');
  };
  provider.imageModel = (): ImageModelV2 => {
    throw new Error('imageModel method is not implemented.');
  };
  return provider as JinaProvider;
}

export const jina = createJina();

export type { MultimodalEmbeddingInput, JinaEmbeddingModelId };
