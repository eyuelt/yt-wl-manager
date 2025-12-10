/**
 * Gemini AI Tagging Utility
 *
 * Uses Google's Gemini API to generate relevant tags for YouTube videos
 * based on video URL, title, and channel information.
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generate tags for a video using Gemini AI
 * @param {Object} video - Video object with id, url, title, channel
 * @param {string} apiKey - User's Gemini API key
 * @returns {Promise<string[]>} Array of generated tags (empty array on error)
 */
export async function geminiTag(video, apiKey) {
    if (!apiKey) {
        console.warn('No Gemini API key provided');
        return [];
    }

    if (!video || !video.url || !video.title) {
        console.warn('Invalid video data for Gemini tagging:', video);
        return [];
    }

    try {
        const prompt = buildPrompt(video);
        const response = await callGeminiAPI(prompt, apiKey);
        const tags = parseGeminiResponse(response);

        console.log(`Gemini tagged "${video.title}" with:`, tags);
        return tags;
    } catch (error) {
        console.error('Error in geminiTag:', error);
        return [];
    }
}

/**
 * Build the prompt for Gemini API
 * @param {Object} video - Video object
 * @returns {string} Formatted prompt
 */
function buildPrompt(video) {
    return `Given this YouTube video:
- URL: ${video.url}
- Title: ${video.title}
- Channel: ${video.channel || 'Unknown'}

Generate 1-5 relevant category tags for this video. Use your knowledge of YouTube content.
Return ONLY a JSON array of tag strings, e.g. ["Tech", "Tutorial", "Python"]
If you can't confidently categorize, make a best guess based on the title and channel.`;
}

/**
 * Call Gemini API with the prompt
 * @param {string} prompt - The prompt to send
 * @param {string} apiKey - User's Gemini API key
 * @returns {Promise<Object>} API response
 */
async function callGeminiAPI(prompt, apiKey) {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

/**
 * Parse Gemini API response to extract tags
 * @param {Object} response - Gemini API response
 * @returns {string[]} Array of tags
 */
function parseGeminiResponse(response) {
    try {
        // Extract text from Gemini response structure
        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.warn('No text in Gemini response:', response);
            return [];
        }

        // Clean up the response (remove markdown code blocks if present)
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json\s*/g, '');
        cleanText = cleanText.replace(/```\s*/g, '');
        cleanText = cleanText.trim();

        // Parse as JSON
        const tags = JSON.parse(cleanText);

        // Validate it's an array of strings
        if (!Array.isArray(tags)) {
            console.warn('Gemini response is not an array:', tags);
            return [];
        }

        // Filter to only valid string tags
        return tags
            .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
            .map(tag => tag.trim());
    } catch (error) {
        console.error('Error parsing Gemini response:', error);
        return [];
    }
}

export default geminiTag;
