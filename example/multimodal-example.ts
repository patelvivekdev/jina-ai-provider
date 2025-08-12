import { jina, type MultimodalEmbeddingInput } from '../src/index';
import { embedMany } from 'ai';

async function main() {
  const embeddingModel = jina.multiModalEmbeddingModel('jina-clip-v2');

  const multimodalValues = [
    { text: 'A beautiful sunset over the beach' },
    { image: 'https://i.ibb.co/r5w8hG8/beach2.jpg' },
  ];

  try {
    const response = await embedMany<MultimodalEmbeddingInput>({
      model: embeddingModel,
      values: multimodalValues,
      providerOptions: {
        jina: {
          outputDimension: 6,
        },
      },
    });

    for (const [index, embedding] of response.embeddings.entries()) {
      console.log(
        'Input:',
        multimodalValues[index]?.text || multimodalValues[index]?.image,
      );
      console.log('Embedding:', embedding);
      console.log('--------------------------------');
    }
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

main().catch(console.error);
