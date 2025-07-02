import { z } from 'zod/v4';

export type JinaEmbeddingModelId =
  // Text Embedding Models
  | 'jina-embeddings-v3'
  | 'jina-embeddings-v2-base-en'
  | 'jina-embeddings-v2-base-code'

  // Multimodal Embedding Models
  | 'jina-clip-v2'
  | 'jina-clip-v1'
  | (string & {});

export const jinaEmbeddingOptions = z.object({
  /**
   * The input type for the embeddings.
   *
   * Defaults to `retrieval.passage`.
   *
   * Used to convey intended downstream application to help the model produce better embeddings.
   *
   * Must be one of the following values:
   * - `retrieval.query`: Specifies the given text is a query in a search or retrieval setting.
   * - `retrieval.passage`: Specifies the given text is a document in a search or retrieval setting.
   * - `text-matching`: Specifies the given text is used for Semantic Textual Similarity.
   * - `classification`: Specifies that the embedding is used for classification.
   * - `separation`: Specifies that the embedding is used for clustering.
   */

  inputType: z
    .enum([
      'text-matching',
      'retrieval.query',
      'retrieval.passage',
      'separation',
      'classification',
    ])
    .optional(),

  /**
   * The number of dimensions for the resulting output embeddings.
   *
   * - `jina-embeddings-v3`:
   *   - Min Output Dimensions: 32 for better performance
   *   - Max Output Dimensions: 1,024
   *
   * - `jina-clip-v2`:
   *   - Min Output Dimensions: 64
   *   - Max Output Dimensions: 1,024
   *
   * - `jina-clip-v1`:
   *   - Output Dimensions: 768
   *
   * Please refer to the model documentation for the supported values.
   *
   * @see https://jina.ai/api-dashboard/embedding
   */
  outputDimension: z.number().optional(),

  /**
   * Late chunking
   *
   * When enabled, the model will automatically split the input into chunks of 1024 tokens each.
   *
   * @see https://jina.ai/news/jina-embeddings-v3-a-frontier-multilingual-embedding-model/#parameter-latechunking
   *
   * Defaults to false.
   *
   * This is only supported in text embedding models.
   */
  lateChunking: z.boolean().optional(),

  /**
   * The data type for the resulting output embeddings.
   *
   * Defaults to `float`.
   *
   * - `float`: 32-bit floating-point numbers
   * - `binary`: 8-bit binary values
   * - `ubinary`: 8-bit unsigned binary values
   * - `base64`: Base64 encoded strings
   */
  embeddingType: z.enum(['float', 'binary', 'ubinary', 'base64']).optional(),

  /**
   * Whether to normalize the resulting output embeddings.
   * Scales the embedding so its Euclidean (L2) norm becomes 1, preserving direction. Useful when downstream involves dot-product, classification, visualization.
   * Defaults to true.
   */
  normalized: z.boolean().optional(),

  /**
   * Truncate at Maximum Context Length which is 8k tokens
   *
   * When enabled, the model will automatically drop the tail that extends beyond the maximum context length allowed by the model instead of throwing an error.
   *
   * Defaults to false.
   */
  truncate: z.boolean().optional(),
});

export type JinaEmbeddingOptions = z.infer<typeof jinaEmbeddingOptions>;
