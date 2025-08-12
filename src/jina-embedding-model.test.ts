import type { EmbeddingModelV2Embedding } from '@ai-sdk/provider';
import { createTestServer } from '@ai-sdk/provider-utils/test';
import { createJina } from './jina-provider';
import type { jinaEmbeddingOptions } from './jina-embedding-options';

const dummyEmbeddings = [
  [0.1, 0.2, 0.3, 0.4, 0.5],
  [0.6, 0.7, 0.8, 0.9, 1],
];

const testValues = ['sunny day at the beach', 'rainy day in the city'];

const provider = createJina({
  baseURL: 'https://api.jina.ai/v1',
  apiKey: 'test-api-key',
});
const model = provider.textEmbeddingModel('jina-embeddings-v3');

const server = createTestServer({
  'https://api.jina.ai/v1/embeddings': {},
});

describe('JinaTextEmbeddingModel', () => {
  function prepareJsonResponse({
    embeddings = dummyEmbeddings,
    usage = {
      prompt_tokens: 4,
      total_tokens: 12,
    },
    headers,
  }: {
    embeddings?: EmbeddingModelV2Embedding[];
    usage?: { prompt_tokens: number; total_tokens: number };
    headers?: Record<string, string>;
  } = {}) {
    server.urls['https://api.jina.ai/v1/embeddings'].response = {
      type: 'json-value',
      headers,
      body: {
        object: 'list',
        data: embeddings.map((embedding, i) => ({
          object: 'embedding',
          embedding,
          index: i,
        })),
        model: 'jina-embeddings-v3',
        usage,
      },
    };
  }

  it('should extract embeddings', async () => {
    prepareJsonResponse();

    const { embeddings } = await model.doEmbed({ values: testValues });

    expect(embeddings).toStrictEqual(dummyEmbeddings);
  });

  it('should expose the raw response headers', async () => {
    prepareJsonResponse({
      headers: { 'test-header': 'test-value' },
    });

    const values = ['sunny day at the beach', 'rainy day in the city'];

    const { response } = await model.doEmbed({ values });

    expect(response?.headers).toStrictEqual({
      'content-length': '233',
      // default headers:
      'content-type': 'application/json',

      // custom header
      'test-header': 'test-value',
    });
  });

  it('should pass custom headers', async () => {
    prepareJsonResponse();

    const jina = createJina({
      baseURL: 'https://api.jina.ai/v1',
      apiKey: 'test-api-key',
      headers: {
        'Custom-Provider-Header': 'provider-header-value',
      },
    });

    const values = ['sunny day at the beach', 'rainy day in the city'];

    await jina.textEmbeddingModel('jina-embeddings-v3').doEmbed({
      values,
      headers: {
        'Custom-Request-Header': 'request-header-value',
      },
    });

    const requestHeaders = server?.calls[0]?.requestHeaders;

    expect(requestHeaders).toStrictEqual({
      authorization: 'Bearer test-api-key',
      'content-type': 'application/json',
      'custom-provider-header': 'provider-header-value',
      'custom-request-header': 'request-header-value',
    });
  });

  it('should pass the options', async () => {
    prepareJsonResponse();

    const jina = createJina({
      baseURL: 'https://api.jina.ai/v1',
      apiKey: 'test-api-key',
    });

    const values = ['sunny day at the beach', 'rainy day in the city'];

    await jina.textEmbeddingModel('jina-embeddings-v3').doEmbed({
      values,
      providerOptions: {
        jina: {
          inputType: 'retrieval.query',
          outputDimension: 2048,
          embeddingType: 'binary',
        } as jinaEmbeddingOptions,
      },
    });

    const requestBody = await server.calls[0]?.requestBodyJson;

    expect(requestBody).toStrictEqual({
      dimensions: 2048,
      embedding_type: 'binary',
      input: ['sunny day at the beach', 'rainy day in the city'],
      model: 'jina-embeddings-v3',
      task: 'retrieval.query',
      normalized: true,
      truncate: false,
    });
  });
});
