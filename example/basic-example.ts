import { jina } from '../src/index';
import { embedMany } from 'ai';

async function main() {
  const textEmbeddingModel = jina.textEmbeddingModel('jina-embeddings-v3', {
    outputDimension: 3,
    inputType: 'retrieval.passage',
    embeddingType: 'float',
    normalized: true,
    truncate: true,
    lateChunking: true,
  });

  const textValues: string[] = [
    'A beautiful sunset over the beach',
    'Sunny day at the beach',
  ];

  try {
    const textResponse = await embedMany({
      model: textEmbeddingModel,
      values: textValues,
    });

    for (const [index, embedding] of textResponse.embeddings.entries()) {
      console.log('Text:', textValues[index]);
      console.log('Embedding:', embedding);
      console.log('--------------------------------');
    }
  } catch (error) {
    console.error('Error generating text embeddings:', error);
    throw error;
  }
}

main().catch(console.error);
