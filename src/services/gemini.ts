import axios from 'axios';

export async function generateNewsStory(url: string): Promise<{ content: string; category: string; sources: { title: string; uri: string }[]; overallConfidence: number; error?: string }> {
  try {
    const response = await axios.post('https://newsgenerator-nine.vercel.app/api/generate-news', { url });
    return response.data;
  } catch (error) {
    console.error('Error generating news story:', error);
    throw new Error('Failed to generate news story');
  }
}

export async function generateRadioIntro(titles: string): Promise<{ content: string; error?: string }> {
  try {
    const response = await axios.post('https://newsgenerator-nine.vercel.app/api/generate-intro', { titles });
    return response.data;
  } catch (error) {
    console.error('Error generating radio intro:', error);
    throw new Error('Failed to generate radio intro');
  }
}

function extractCategory(result: any): string {
  // Assuming the category is included in the response text
  const categoryMatch = result.response.text().match(/Categorie:\s*(.+)/);
  return categoryMatch ? categoryMatch[1].trim() : 'Uncategorized';
}

function processResult(result: any): { content: string; sources: { title: string; uri: string }[]; overallConfidence: number; error?: string } {
  const text = result.response.text();
  const sources: { title: string; uri: string }[] = [];
  let totalConfidence = 0;
  let confidenceCount = 0;

  if (result.response.candidates && result.response.candidates.length > 0) {
    const groundingMetadata = result.response.candidates[0].groundingMetadata;

    // Stringify groundingMetadata and store in a separate variable
    const groundingMetadataString = JSON.stringify(groundingMetadata);
    console.log("Grounding Metadata:", groundingMetadataString);

    // Parse the string back to an object
    const parsedGroundingMetadata = JSON.parse(groundingMetadataString);

    // Extract sources from groundingChunks
    if (parsedGroundingMetadata.groundingChunks) {
      parsedGroundingMetadata.groundingChunks.forEach((chunk: { web: { uri: string; title: string } }) => {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      });
    }

    // Extract confidence scores from groundingSupports
    if (parsedGroundingMetadata.groundingSupports) {
      parsedGroundingMetadata.groundingSupports.forEach((support: { confidenceScores: number[] }) => {
        support.confidenceScores.forEach((score) => {
          totalConfidence += score;
          confidenceCount++;
        });
      });
    }
  }

  const overallConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  return {
    content: text,
    sources,
    overallConfidence,
    error: undefined,
  };
}
