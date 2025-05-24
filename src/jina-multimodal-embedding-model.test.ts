import type { EmbeddingModelV1Embedding } from '@ai-sdk/provider';
import { createTestServer } from '@ai-sdk/provider-utils/test';
import { createJina } from './jina-provider';

const dummyEmbeddings = [
  [0.1, 0.2, 0.3],
  [0.6, 0.7, 0.8],
];

const provider = createJina({
  baseURL: 'https://api.jina.ai/v1',
  apiKey: 'jina-api-key',
});

const model = provider.multiModalEmbeddingModel('jina-clip-v2');

const server = createTestServer({
  'https://api.jina.ai/v1/embeddings': {},
});

const testValues = [
  { image: 'https://i.ibb.co/nQNGqL0/beach1.jpg' },
  { text: 'A beautiful sunset on the beach' },
];

describe('JinaMultiModalEmbeddingModel', () => {
  function prepareJsonResponse({
    embeddings = dummyEmbeddings,
    usage = {
      prompt_tokens: 4,
      total_tokens: 12,
    },
    headers,
  }: {
    embeddings?: EmbeddingModelV1Embedding[];
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
        model: 'jina-clip-v2',
        usage,
      },
    };
  }

  it('should extract embeddings', async () => {
    prepareJsonResponse();

    const { embeddings } = await model.doEmbed({ values: testValues });

    expect(embeddings).toStrictEqual(dummyEmbeddings);
  });

  it('should handle base64 images', async () => {
    prepareJsonResponse();

    const values = [
      {
        image:
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVR...',
      },
      {
        text: 'A beautiful sunset on the beach',
      },
    ];

    await model.doEmbed({ values });

    const requestBody = await server.calls[0]?.requestBody;

    expect(requestBody).toStrictEqual({
      input: [
        {
          image:
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVR...',
        },
        {
          text: 'A beautiful sunset on the beach',
        },
      ],
      model: 'jina-clip-v2',
      normalized: true,
      truncate: false,
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

    await jina.multiModalEmbeddingModel('jina-clip-v2').doEmbed({
      values: testValues,
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

  it('should pass settings correctly', async () => {
    prepareJsonResponse();

    const jina = createJina({
      baseURL: 'https://api.jina.ai/v1',
      apiKey: 'test-api-key',
    });

    const modelWithSettings = jina.multiModalEmbeddingModel('jina-clip-v2', {
      inputType: 'retrieval.passage',
      outputDimension: 768,
      embeddingType: 'binary',
    });

    const values = [{ text: 'test' }];

    await modelWithSettings.doEmbed({ values });

    const requestBody = await server.calls[0]?.requestBody;

    expect(requestBody).toStrictEqual({
      input: [{ text: 'test' }],
      model: 'jina-clip-v2',
      task: 'retrieval.passage',
      dimensions: 768,
      embedding_type: 'binary',
      normalized: true,
      truncate: false,
    });
  });
});
