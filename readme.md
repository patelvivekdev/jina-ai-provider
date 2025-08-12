# AI SDK - Jina AI Provider

<div align="center">
<a href="https://www.npmjs.com/package/jina-ai-provider"><img src="https://img.shields.io/npm/v/jina-ai-provider"/><a>
<a href="https://www.npmjs.com/package/jina-ai-provider"><img src="https://img.shields.io/npm/dm/jina-ai-provider"/><a>
<a href="https://github.com/patelvivekdev/jina-ai-provider/actions/workflows/CI.yml"><img src="https://github.com/patelvivekdev/jina-ai-provider/actions/workflows/CI.yml/badge.svg"/><a>
</div>
<br>

## Introduction

The Jina AI Provider is a provider for the AI SDK. It provides a simple interface to the Jina AI API for both text and multimodal embeddings.

## Installation

```bash
npm install jina-ai-provider

# or

yarn add jina-ai-provider

# or

pnpm add jina-ai-provider

# or

bun add jina-ai-provider
```

## Configuration

The Jina AI Provider requires an API key to be configured. You can obtain an API key by signing up at [Jina](https://jina.ai).

Add the following to your `.env` file:

```bash
JINA_API_KEY=your-api-key
```

## Provider Instance

You can use the default provider instance or create your own configured instance.

```ts
import { jina } from 'jina-ai-provider';
// or
import { createJina } from 'jina-ai-provider';

const customJina = createJina({
  // provider-level settings (not part of providerOptions)
  apiKey: process.env.JINA_API_KEY,
  // baseURL: 'https://api.jina.ai/v1',
  // headers: { 'x-my-header': 'value' },
  // fetch: yourCustomFetch,
});
```

You can use the following optional settings to customize the Jina provider instance:

- **baseURL** string
  - The base URL of the Jina API. Defaults to `https://api.jina.ai/v1`.
- **apiKey** string
  - API key sent via the `Authorization` header. Defaults to the `JINA_API_KEY` environment variable.
- **headers** Record<string, string>
  - Custom headers to include with every request.
- **fetch** (input: RequestInfo, init?: RequestInit) => Promise<Response>
  - Custom fetch implementation or middleware (for interception, testing, etc.).

## Usage

### Text Embeddings

```typescript
import { jina } from 'jina-ai-provider';
import { embedMany } from 'ai';

const textEmbeddingModel = jina.textEmbeddingModel('jina-embeddings-v3');

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = value.split('\n');

  const { embeddings } = await embedMany({
    model: textEmbeddingModel,
    values: chunks,
    providerOptions: {
      // Jina embedding options for this request
      jina: {
        outputDimension: 3,
        inputType: 'retrieval.passage',
        embeddingType: 'float',
        normalized: true,
        truncate: true,
        lateChunking: true,
      },
    },
  });

  return embeddings.map((embedding, index) => ({
    content: chunks[index]!,
    embedding,
  }));
};
```

### Multimodal Embeddings (Text + Images)

```typescript
import { jina, type MultimodalEmbeddingInput } from 'jina-ai-provider';
import { embedMany } from 'ai';

const multimodalModel = jina.multiModalEmbeddingModel('jina-clip-v2');

export const generateMultimodalEmbeddings = async () => {
  const values: MultimodalEmbeddingInput[] = [
    { text: 'A beautiful sunset over the beach' },
    { image: 'https://i.ibb.co/r5w8hG8/beach2.jpg' },
  ];

  const { embeddings } = await embedMany<MultimodalEmbeddingInput>({
    model: multimodalModel,
    values,
    providerOptions: {
      jina: {
        outputDimension: 6,
      },
    },
  });

  return embeddings.map((embedding, index) => ({
    content: values[index]!,
    embedding,
  }));
};
```

> [!TIP]
> Use `MultimodalEmbeddingInput` type to ensure type safety when using multimodal embeddings.

### Provider options

Pass Jina embedding options via `providerOptions.jina`. See supported fields below.

```typescript
import { jina } from 'jina-ai-provider';
import { embedMany } from 'ai';

const model = jina.textEmbeddingModel('jina-embeddings-v3');

const { embeddings } = await embedMany({
  model,
  values: ['one', 'two'],
  providerOptions: {
    jina: {
      inputType: 'retrieval.query',
      outputDimension: 1024,
      embeddingType: 'float',
      normalized: true,
      truncate: false,
      lateChunking: false,
    },
  },
});
```

Supported provider options via `providerOptions.jina`:

- **inputType** `'text-matching' | 'retrieval.query' | 'retrieval.passage' | 'separation' | 'classification'`
  - Intended downstream application to help the model produce better embeddings. Defaults to `'retrieval.passage'`.
  - `'retrieval.query'`: input is a search query.
  - `'retrieval.passage'`: input is a document/passage.
  - `'text-matching'`: for semantic textual similarity tasks.
  - `'classification'`: for classification tasks.
  - `'separation'`: for clustering tasks.
- **outputDimension** number
  - Number of dimensions for the output embeddings. See model docs for ranges.
  - `jina-embeddings-v3`: min 32, max 1024.
  - `jina-clip-v2`: min 64, max 1024.
  - `jina-clip-v1`: fixed 768.
- **embeddingType** `'float' | 'binary' | 'ubinary' | 'base64'`
  - Data type for the returned embeddings. Defaults to `'float'`.
- **normalized** boolean
  - Whether to L2-normalize embeddings. Defaults to `true`.
- **truncate** boolean
  - Whether to truncate inputs beyond the model context limit instead of erroring. Defaults to `false`.
- **lateChunking** boolean
  - Split long inputs into 1024-token chunks automatically. Defaults to `false`. Only for text embedding models.

## Max Embeddings Per Call

The Jina AI Provider supports up to 2048 embeddings per call.

## Jina embedding models:

| Model              | Context Length (tokens) | Embedding Dimension | Modalities    |
| ------------------ | ----------------------- | ------------------- | ------------- |
| jina-embeddings-v3 | 8,192                   | 1024                | Text          |
| jina-clip-v2       | 8,192                   | 1024                | Text + Images |
| jina-clip-v1       | 8,192                   | 768                 | Text + Images |

## Supported Input Formats

### Text Embeddings

- Array of strings:
  - `const strings = ["text1", "text2"]`

### Multimodal Embeddings

- Text objects:
  - `const text = [{ text: "Your text here" }]`
- Image objects:
  - `const image = [{ image: "https://example.com/image.jpg" }]`
  - `const image = [{ image: "base64-encoded-image" }]`
- Mixed arrays:
  - `const mixed = [{ text: "object text" }, { image: "image-url" }, {image: "base64-encoded-image"}]`

> [!TIP]
> You can pass base64 encoded image to `image` property.

## Authors

- [patelvivekdev](https://patelvivek.dev)
