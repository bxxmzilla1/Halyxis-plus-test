import { UploadedImage, AspectRatio } from "../types";
import { getWaveSpeedApiKey } from "./apiKeyService";

const WAVESPEED_API_BASE = 'https://api.wavespeed.ai/api/v3';
const WAVESPEED_MODEL = 'alibaba/wan-2.6/image-edit';

interface WaveSpeedRequest {
  enable_prompt_expansion?: boolean;
  images: string[];
  prompt: string;
  seed?: number;
}

interface WaveSpeedResponse {
  code?: number;
  data?: {
    id?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'created';
    outputs?: string[];
    error?: string | null;
    created_at?: string;
    model?: string;
    urls?: {
      get?: string;
    };
    input?: {
      images?: string[];
      prompt?: string;
      seed?: number;
      enable_prompt_expansion?: boolean;
    };
    timings?: {
      inference?: number;
    };
  };
  // Also support direct structure (for backward compatibility)
  id?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'created';
  outputs?: string[];
  error?: string | null;
}

interface WaveSpeedResultResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputs: string[];
  error?: string | null;
}

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 150; // 5 minutes max (150 * 2s)

const handleApiError = (error: unknown): Error => {
  console.error("Error during WaveSpeed API request:", error);

  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null && 'error' in error) {
    const apiError = error as { error: string | { message?: string } };
    errorMessage = typeof apiError.error === 'string' 
      ? apiError.error 
      : apiError.error.message || 'Unknown API error';
  } else {
    errorMessage = String(error);
  }

  // User-friendly error messages
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return new Error('Invalid API key. Please check your WaveSpeed API key in Creator Settings.');
  }
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    return new Error('API key does not have permission. Please check your WaveSpeed API key.');
  }
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return new Error('Rate limit exceeded. Please try again in a few moments.');
  }
  if (errorMessage.includes('quota')) {
    return new Error('API quota exceeded. Please check your WaveSpeed account.');
  }

  return new Error(errorMessage || 'An unexpected error occurred with the WaveSpeed API.');
};

const pollForResult = async (
  requestId: string,
  apiKey: string,
  onProgress?: (status: string) => void
): Promise<string[]> => {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    try {
      const response = await fetch(
        `${WAVESPEED_API_BASE}/predictions/${requestId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      let data: WaveSpeedResponse;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse polling response:', responseText);
        throw new Error('Invalid JSON response from API');
      }

      // Handle wrapped response structure (code + data)
      const responseData = data.data || data;
      const status = responseData.status || data.status || 'pending';
      const outputs = responseData.outputs || data.outputs;
      const error = responseData.error || data.error;

      if (onProgress) {
        onProgress(status);
      }

      if (status === 'completed') {
        // Check if outputs are already in the response
        if (outputs && outputs.length > 0) {
          return outputs;
        }

        // Otherwise, try to get the result from the result endpoint
        const resultUrl = responseData.urls?.get || data.urls?.get || `${WAVESPEED_API_BASE}/predictions/${requestId}/result`;
        
        const resultResponse = await fetch(
          resultUrl,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!resultResponse.ok) {
          throw new Error(`Failed to fetch result: HTTP ${resultResponse.status}`);
        }

        const resultText = await resultResponse.text();
        let resultData: any;
        
        try {
          resultData = JSON.parse(resultText);
        } catch (parseError) {
          console.error('Failed to parse result response:', resultText);
          throw new Error('Invalid JSON response from result endpoint');
        }

        // Handle wrapped response structure
        const resultOutputs = resultData.data?.outputs || resultData.outputs;
        
        if (resultOutputs && resultOutputs.length > 0) {
          return resultOutputs;
        } else {
          throw new Error('No output URLs returned from API');
        }
      }

      if (status === 'failed') {
        const errorMsg = error && error.trim() ? error : 'Image generation failed';
        throw new Error(errorMsg);
      }

      // Status is 'pending' or 'processing', wait and retry
      attempts++;
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP')) {
        throw handleApiError(error);
      }
      attempts++;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error('Request timed out. The image generation is taking longer than expected.');
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  throw new Error('Request timed out. Please try again.');
};

export const validateWaveSpeedApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;

  try {
    // Try to make a simple request to validate the key
    // We'll use a minimal request that should fail fast if invalid
    const response = await fetch(
      `${WAVESPEED_API_BASE}/predictions/invalid-id`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 401 means invalid key, 404 means key is valid but ID doesn't exist (which is fine)
    return response.status !== 401;
  } catch (error) {
    console.warn("WaveSpeed API Key validation check failed:", error);
    return false;
  }
};

export const editImageWithWaveSpeed = async (
  image: UploadedImage,
  prompt: string,
  enablePromptExpansion: boolean = false,
  seed: number = -1,
  onProgress?: (status: string) => void
): Promise<string> => {
  const API_KEY = getWaveSpeedApiKey();
  if (!API_KEY) {
    throw new Error("WaveSpeed API key is not set. Please enter your API key in Creator Settings.");
  }

  try {
    // Convert base64 image to data URI format
    const imageDataUri = `data:${image.mimeType};base64,${image.base64}`;

    const requestBody: WaveSpeedRequest = {
      enable_prompt_expansion: enablePromptExpansion,
      images: [imageDataUri],
      prompt: prompt,
      seed: seed,
    };

    // Submit the request
    const response = await fetch(
      `${WAVESPEED_API_BASE}/${WAVESPEED_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      throw handleApiError({ error: errorData.error || `HTTP ${response.status}` });
    }

    const responseText = await response.text();
    let data: WaveSpeedResponse;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response:', responseText);
      throw new Error('Invalid JSON response from API');
    }

    // Log the response for debugging
    console.log('WaveSpeed API response:', data);

    // Handle wrapped response structure (code + data)
    const responseData = data.data || data;
    const requestId = responseData.id || data.id || (data as any).prediction_id || (data as any).request_id;
    const status = responseData.status || data.status || 'pending';
    
    if (!requestId) {
      console.error('API response missing ID:', data);
      throw new Error('Invalid response from API: missing request ID. Please check the API response format.');
    }

    // Poll for the result
    if (onProgress) {
      onProgress(status);
    }

    const outputs = await pollForResult(requestId, API_KEY, onProgress);

    if (!outputs || outputs.length === 0) {
      throw new Error('No output image URL returned from API');
    }

    // Return the first output URL
    return outputs[0];

  } catch (error) {
    throw handleApiError(error);
  }
};

export const editImageWithWaveSpeedMultiple = async (
  images: UploadedImage[],
  prompt: string,
  enablePromptExpansion: boolean = false,
  seed: number = -1,
  onProgress?: (status: string) => void
): Promise<string> => {
  const API_KEY = getWaveSpeedApiKey();
  if (!API_KEY) {
    throw new Error("WaveSpeed API key is not set. Please enter your API key in Creator Settings.");
  }

  try {
    // Convert base64 images to data URI format
    const imageDataUris = images.map(img => `data:${img.mimeType};base64,${img.base64}`);

    // WaveSpeed supports up to 3 images
    if (imageDataUris.length > 3) {
      throw new Error('WaveSpeed API supports a maximum of 3 input images.');
    }

    const requestBody: WaveSpeedRequest = {
      enable_prompt_expansion: enablePromptExpansion,
      images: imageDataUris,
      prompt: prompt,
      seed: seed,
    };

    // Submit the request
    const response = await fetch(
      `${WAVESPEED_API_BASE}/${WAVESPEED_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      throw handleApiError({ error: errorData.error || `HTTP ${response.status}` });
    }

    const responseText = await response.text();
    let data: WaveSpeedResponse;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response:', responseText);
      throw new Error('Invalid JSON response from API');
    }

    // Log the response for debugging
    console.log('WaveSpeed API response:', data);

    // Handle wrapped response structure (code + data)
    const responseData = data.data || data;
    const requestId = responseData.id || data.id || (data as any).prediction_id || (data as any).request_id;
    const status = responseData.status || data.status || 'pending';
    
    if (!requestId) {
      console.error('API response missing ID:', data);
      throw new Error('Invalid response from API: missing request ID. Please check the API response format.');
    }

    // Poll for the result
    if (onProgress) {
      onProgress(status);
    }

    const outputs = await pollForResult(requestId, API_KEY, onProgress);

    if (!outputs || outputs.length === 0) {
      throw new Error('No output image URL returned from API');
    }

    // Return the first output URL
    return outputs[0];

  } catch (error) {
    throw handleApiError(error);
  }
};
