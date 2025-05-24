import { jina } from '../src/index';
import { embedMany } from 'ai';
import type { MultimodalEmbeddingInput } from '../src/jina-embedding-model';

// This file demonstrates the type safety of the new implementation
// Run with: npx tsc --noEmit example/type-safety-demo.ts

async function demonstrateTypeSafety() {
  // ✅ VALID: Text-only embedding model with string array
  const textEmbeddingModel = jina.textEmbeddingModel('jina-embeddings-v3');
  const textValues: string[] = [
    'A beautiful sunset over the beach',
    'Un beau coucher de soleil sur la plage',
  ];

  // This works fine
  await embedMany({
    model: textEmbeddingModel,
    values: textValues,
  });

  // ✅ VALID: Multimodal embedding model with MultimodalEmbeddingInput array
  const multimodalEmbeddingModel =
    jina.multiModalEmbeddingModel('jina-clip-v2');
  const multimodalValues: MultimodalEmbeddingInput[] = [
    { text: 'A beautiful sunset over the beach' },
    { image: 'https://i.ibb.co/r5w8hG8/beach2.jpg' },
  ];

  // This works fine
  await embedMany({
    model: multimodalEmbeddingModel,
    values: multimodalValues,
  });

  // ❌ INVALID: The following will cause TypeScript compilation errors:

  // Error: Type 'MultimodalEmbeddingInput' is not assignable to type 'string'
  // await embedMany({
  //   model: textEmbeddingModel,
  //   values: [{ text: 'This should not work' }],
  // });

  // Error: Type 'string' is not assignable to type 'MultimodalEmbeddingInput'
  // await embedMany({
  //   model: multimodalEmbeddingModel,
  //   values: ['This should not work'],
  // });

  // Error: Mixed arrays are not allowed - each element must be the same type
  // const mixedValues = [
  //   'A beautiful sunset over the beach',
  //   { text: 'Another text', image: 'https://example.com/image.jpg' },
  // ];
  // await embedMany({
  //   model: textEmbeddingModel,
  //   values: mixedValues, // TypeScript error!
  // });

  console.log('✅ Type safety demonstration completed successfully!');
  console.log('All valid operations compiled without errors.');
  console.log('Invalid operations would cause TypeScript compilation errors.');
}

// Export for potential use, but don't run (since we don't have API keys)
export { demonstrateTypeSafety };
