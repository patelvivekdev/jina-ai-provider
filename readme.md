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

## Usage

### Text Embeddings

```typescript
import { jina } from 'jina-ai-provider';
import { embedMany } from 'ai';

const embeddingModel = jina.textEmbeddingModel('jina-embeddings-v3');

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  // Generate chunks from the input value
  const chunks = value.split('\n');

  // Optional: You can also split the input value by comma
  // const chunks = value.split('.');

  // Or you can use LLM to generate chunks(summarize) from the input value

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};
```

### Multimodal Embeddings (Text + Images)

```typescript
import { jina, type MultimodalEmbeddingInput } from 'jina-ai-provider';
import { embedMany } from 'ai';

const multimodalModel = jina.multiModalEmbeddingModel('jina-clip-v2');

export const generateMultimodalEmbeddings = async () => {
  const values = [
    { text: 'A beautiful sunset over the beach' },
    { image: 'https://i.ibb.co/r5w8hG8/beach2.jpg' },
  ];

  const { embeddings } = await embedMany<MultimodalEmbeddingInput>({
    model: multimodalModel,
    values: values,
  });

  return embeddings.map((embedding, index) => ({
    content: values[index],
    embedding: embedding,
  }));
};
```

> [!TIP]
> Use `MultimodalEmbeddingInput` type to ensure type safety when using multimodal embeddings.

### How to pass additional settings to the model

The settings object should contain the settings you want to add to the model. You can find the available settings for the model in the Jina API documentation: https://jina.ai/embeddings/

```typescript
import { createJina } from 'jina-ai-provider';

const jina = createJina({
  apiKey: process.env.JINA_API_KEY,
});

// Initialize the embedding model with settings
const embeddingModel = jina.textEmbeddingModel(
  'jina-embeddings-v3',
  // adding settings
  {
    inputType: 'retrieval.query',
    outputDimension: 1024,
    embeddingType: 'float',
  },
);
```

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
