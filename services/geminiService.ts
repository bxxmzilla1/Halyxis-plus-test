import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AspectRatio, UploadedImage } from "../types";
import { getEffectiveApiKey } from "./apiKeyService";

// These safety settings are configured to be the most permissive.
// The `BLOCK_NONE` threshold allows all content for the specified categories.
// This applies to both the input prompt and the image, giving you maximum freedom in prompting.
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const handleApiError = (error: unknown): Error => {
    console.error("Error during image generation request:", error);

    let errorMessage: string;
    
    if (error instanceof Error) {
        errorMessage = error.message;
        try {
            // Handle cases where the error message is a JSON string from the API, 
            // or contains a JSON string (e.g. "[GoogleGenAI Error]: ... { ... }")
            const jsonStartIndex = errorMessage.indexOf('{');
            const jsonEndIndex = errorMessage.lastIndexOf('}');
            
            if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                const jsonString = errorMessage.substring(jsonStartIndex, jsonEndIndex + 1);
                const parsedError = JSON.parse(jsonString);
                
                if (parsedError.error) {
                    // Check for permission denied status directly in the JSON object
                    // This handles the {"error":{"code":403,"message":"...","status":"PERMISSION_DENIED"}} case
                    if (parsedError.error.status === 'PERMISSION_DENIED' || parsedError.error.code === 403) {
                         return new Error('Permission denied. Please check that your API key is valid and has the required permissions.');
                    }
                    if (parsedError.error.message) {
                        errorMessage = parsedError.error.message;
                    }
                }
            }
        } catch (e) {
            // Parsing failed or no JSON found, stick with original message
        }
    } else {
        errorMessage = String(error);
    }

    // These messages are thrown from within our app logic and are already user-friendly.
    const userFriendlyMessages = [
        'Generation failed', 'Generation blocked', 'The model could not', 
        'Image generation interrupted', 'The model was unable',
        'API_KEY is not set', 'Permission denied'
    ];
    if (userFriendlyMessages.some(msg => errorMessage.startsWith(msg))) {
        return new Error(errorMessage);
    }
    
    // Specific check for invalid key in AI Studio environment, which needs to be caught by App.tsx
    if (errorMessage.includes('Requested entity was not found')) {
        return new Error(errorMessage);
    }

    // Create more user-friendly messages for common technical errors.
    if (errorMessage.includes('quota')) {
      return new Error('API quota exceeded. Please check your project billing status or try again later.');
    }
    if (errorMessage.includes('API key not valid')) {
      return new Error('The provided API key is not valid. Please select a valid key.');
    }
    if (errorMessage.includes('leaked')) {
        return new Error('Your API key was reported as compromised. For security, please use a new API key.');
    }
    if (errorMessage.includes('expired')) {
        return new Error('Your API key has expired. Please use a different, active API key.');
    }
    // Broader check for permission errors to catch "The caller does not have permission"
    if (errorMessage.includes('PERMISSION_DENIED') || 
        errorMessage.includes('The caller does not have permission') ||
        errorMessage.includes('403')) {
        return new Error('Permission denied. Please check that your API key is valid and has the required permissions.');
    }
    
    // For anything else, provide a generic but helpful message.
    return new Error("An unexpected error occurred with the AI model. Please try again later.");
}

const processApiResponse = (response: GenerateContentResponse): string => {
    // Check for blocks first
    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('Generation failed. The request or response was flagged by the safety filter. Please adjust your prompt or images.');
    }
     if (response.promptFeedback?.blockReason) {
        throw new Error(`Generation blocked: ${response.promptFeedback.blockReason}. Please modify your inputs.`);
    }

    let imageData: string | null = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }
    
    if (imageData) {
      return imageData;
    }
    
    const responseText = response.text;
    if (responseText) {
        // If we got text back instead of an image, the model probably refused the request.
        throw new Error("The model could not generate an image from your request. It may have refused the prompt. Please try modifying your instructions.");
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        if (finishReason === 'IMAGE_OTHER') {
             throw new Error("The model encountered an issue generating the image. This can sometimes happen with complex scenes or unusual combinations of inputs. Please try adjusting your prompt or using different images.");
        }
        if (finishReason === 'IMAGE_SAFETY') {
            throw new Error('Generation failed because the output image was flagged by safety filters. This can happen with prompts that are close to policy boundaries. Please try modifying your prompt.');
        }
        throw new Error(`Image generation was interrupted for an unexpected reason (${finishReason}). Please try again or adjust your inputs.`);
    }

    throw new Error("The model was unable to generate an image. This can happen with complex prompts. Please try rephrasing or using different images.");
}

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  
  // Create a temporary instance for validation
  const ai = new GoogleGenAI({ apiKey });

  try {
    // We use a lightweight model 'gemini-2.5-flash' for a quick validation check.
    // We request a single token or minimal response to keep it fast/cheap.
    await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: { parts: [{ text: 'Confirm API access' }] },
      config: {
          maxOutputTokens: 1, 
      }
    });
    return true;
  } catch (error) {
    console.warn("API Key validation check failed:", error);
    return false;
  }
};

export const editImageWithPrompt = async (
  personImage: UploadedImage,
  referenceImage: UploadedImage,
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  const API_KEY = getEffectiveApiKey();
  if (!API_KEY) {
    throw new Error("API_KEY is not set. Please enter your API Key in Creator Settings.");
  }

  // Create a new instance for each call to use the latest key.
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const personImagePart = {
      inlineData: {
        data: personImage.base64,
        mimeType: personImage.mimeType,
      },
    };
    
    const referenceImagePart = {
      inlineData: {
        data: referenceImage.base64,
        mimeType: referenceImage.mimeType,
      },
    };

    let engineeredPrompt = `**Primary Objective:** Create a photorealistic image that is an **exact replica** of the person from the first image, but placed into the context of the second reference image.

**CRITICAL INSTRUCTIONS:**
1.  **Identity Preservation (Highest Priority):**
    *   The person in the output image **MUST** have the identical facial features, facial structure, skin tone, hair style, and eye color as the person in the **first image**.
    *   Treat the first image as a "face lock". Do **NOT** alter the person's likeness in any way. Do **NOT** blend features from the reference image's person.
2.  **Contextual Adaptation (Secondary Priority):**
    *   Use the **second image** as a reference for the **pose, clothing, background, and lighting style**.
    *   Apply these elements to the person from the first image.
    *   **NEVER** copy the face or identity from the second image.

**Final Output:** A seamless, high-quality photograph where the person from image 1 is perfectly recognizable and integrated into the scene from image 2.`;

    if (prompt) {
      engineeredPrompt += `\n\n**Additional User Modifications:** ${prompt}`;
    }

    const textPart = {
      text: engineeredPrompt,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [personImagePart, referenceImagePart, textPart],
      },
      // FIX: `safetySettings` must be a part of the `config` object.
      config: {
        imageConfig: {
          imageSize: '2K', // For higher resolution
          aspectRatio: aspectRatio,
        },
        // Apply the minimum safety settings to allow for a wider range of prompts and image generations.
        safetySettings,
      },
    });

    return processApiResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};


export const editImageWithPromptOnly = async (
  personImage: UploadedImage,
  prompt: string,
  aspectRatio: AspectRatio,
  backgroundImage: UploadedImage | null
): Promise<string> => {
  const API_KEY = getEffectiveApiKey();
  if (!API_KEY) {
    throw new Error("API_KEY is not set. Please enter your API Key in Creator Settings.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const personImagePart = {
      inlineData: {
        data: personImage.base64,
        mimeType: personImage.mimeType,
      },
    };
    const imageParts = [personImagePart];

    let engineeredPrompt: string;

    if (backgroundImage) {
        const backgroundImagePart = {
            inlineData: {
                data: backgroundImage.base64,
                mimeType: backgroundImage.mimeType,
            },
        };
        imageParts.push(backgroundImagePart);

        engineeredPrompt = `**Primary Objective:** Generate a photorealistic image featuring an **exact replica** of the person from the first uploaded image, placing them seamlessly into the provided background image.

**CRITICAL INSTRUCTIONS:**
1.  **Identity Preservation (Highest Priority):**
    *   The person in the output image **MUST** have the identical facial features, facial structure, skin tone, hair style, and eye color as the person in the **first uploaded image**.
    *   Treat the first image as a "face lock". Do **NOT** alter the person's likeness.
2.  **Background & Lighting Integration (Highest Priority):**
    *   Use the **second uploaded image** as the definitive background for the scene. Do **NOT** generate a new background.
    *   **Lighting Replication (Crucial):** The lighting on the person (including highlights, shadows, ambient light, and color temperature) **MUST** perfectly match the lighting conditions present in the background image. The person should look as if they were photographed in that exact environment.
    *   Place the person realistically within this background, ensuring consistent shadows and perspective.
3.  **User-Directed Modifications (Secondary Priority):**
    *   Apply the following changes based on the user's description: "${prompt}"
    *   These changes should primarily apply to the person's clothing, pose, or expression. Modifications to the background should be minimal and only if explicitly requested.

**Final Output:** A high-quality, realistic photograph that strictly preserves the person's identity and places them believably in the provided background with perfectly matched lighting, while incorporating the requested modifications.`;

    } else {
        engineeredPrompt = `**Primary Objective:** Generate a photorealistic image featuring an **exact replica** of the person from the uploaded image, modified ONLY by the user's description.

**CRITICAL INSTRUCTIONS:**
1.  **Identity Preservation (Highest Priority):**
    *   The person in the output image **MUST** have the identical facial features, facial structure, skin tone, hair style, and eye color as the person in the uploaded image.
    *   Treat the uploaded image as a "face lock". Do **NOT** alter the person's likeness unless specifically instructed to in the prompt below.
2.  **User-Directed Modifications (Secondary Priority):**
    *   Apply the following changes based on the user's description: "${prompt}"
    *   These changes should apply to clothing, background, pose, or expression, but **NOT** the core identity.

**Final Output:** A high-quality, realistic photograph that strictly preserves the person's identity while incorporating the requested modifications.`;
    }

    const textPart = {
      text: engineeredPrompt,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [...imageParts, textPart],
      },
      // FIX: `safetySettings` must be a part of the `config` object.
      config: {
        imageConfig: {
          imageSize: '2K',
          aspectRatio: aspectRatio,
        },
        safetySettings,
      },
    });

    return processApiResponse(response);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const editImageWithMultiplePeople = async (
    personImages: UploadedImage[],
    prompt: string,
    aspectRatio: AspectRatio,
    backgroundImage: UploadedImage | null
): Promise<string> => {
    const API_KEY = getEffectiveApiKey();
    if (!API_KEY) {
        throw new Error("API_KEY is not set. Please enter your API Key in Creator Settings.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const personImageParts = personImages.map(image => ({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            },
        }));

        const allImageParts = [...personImageParts];
        let engineeredPrompt: string;
        
        const identityInstructions = personImages.map((_, index) => 
            `*   **For the person in input image #${index + 1}:** You **MUST** create an exact replica. The facial features, structure, skin tone, hair, and eye color must be identical. Do not alter their likeness in any way.`
        ).join('\n    ');

        if (backgroundImage) {
            const backgroundImagePart = {
                inlineData: {
                    data: backgroundImage.base64,
                    mimeType: backgroundImage.mimeType,
                },
            };
            allImageParts.push(backgroundImagePart);

            engineeredPrompt = `**Primary Objective:** Create a single, cohesive, photorealistic image that includes **exact replicas** of every person from the initial input images, placing them seamlessly into the provided background image.

**CRITICAL INSTRUCTIONS:**
1.  **Identity Preservation (HIGHEST PRIORITY):**
    This is the most important rule. For each person, you must follow this instruction precisely:
    ${identityInstructions}
    *   **Unbreakable Rule:** Treat each input image as an unchangeable "face lock" for one individual. Do **NOT** blend, merge, or average features between different people. Each person must be distinctly and accurately represented.

2.  **Background & Lighting Integration (HIGHEST PRIORITY):**
    *   Use the **LAST** uploaded image as the definitive background for the scene. Do **NOT** generate a new background.
    *   **Lighting Replication (Crucial):** The lighting on all individuals (including highlights, shadows, ambient light, and color temperature) **MUST** perfectly match the lighting conditions present in the background image. Everyone should look as if they were photographed together in that exact environment.
    *   Place all the replicated people realistically within this background, ensuring consistent shadows and perspective.

3.  **Scene Composition (SECONDARY PRIORITY):**
    *   **User's Prompt:** "${prompt}"
    *   Arrange the people naturally within the provided background, considering the context of the user's prompt. Apply any requested changes to clothing, pose, or expression.

**Final Output:** A seamless, high-quality photograph containing all the individuals, where each person is a perfect and recognizable replica from their respective source image, integrated into the provided background with perfectly matched lighting.`;

        } else {
            engineeredPrompt = `**Primary Objective:** Create a single, cohesive, photorealistic image that includes **exact replicas** of every person from all the provided input images.

**CRITICAL INSTRUCTIONS - IDENTITY PRESERVATION (HIGHEST PRIORITY):**
This is the most important rule. For each person, you must follow this instruction precisely:
    ${identityInstructions}

*   **Unbreakable Rule:** Treat each input image as an unchangeable "face lock" for one individual. Do **NOT** blend, merge, or average features between different people. Each person must be distinctly and accurately represented as they appear in their source image. Failure to replicate each face exactly is a failure of the entire task.

**SCENE COMPOSITION (SECONDARY PRIORITY):**
*   **User's Prompt:** "${prompt}"
*   Place all the replicated individuals into the scene described in the user's prompt.
*   Arrange the people naturally within this scene, considering the context of the prompt.

**Final Output:** A seamless, high-quality photograph containing all the individuals, where each person is a perfect and recognizable replica from their respective source image, integrated into the described environment.`;
        }

        const textPart = { text: engineeredPrompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [...allImageParts, textPart],
            },
            // FIX: `safetySettings` must be a part of the `config` object.
            config: {
                imageConfig: {
                    imageSize: '2K',
                    aspectRatio: aspectRatio,
                },
                safetySettings,
            },
        });
        
        return processApiResponse(response);
    } catch (error) {
        throw handleApiError(error);
    }
};
