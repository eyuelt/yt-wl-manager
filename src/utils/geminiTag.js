/**
 * Gemini AI Tagging Utility
 *
 * Uses Google's Gemini API to generate relevant tags for YouTube videos
 * based on video URL, title, and channel information.
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
 * Batch tag multiple videos in a single API call
 * @param {Array} videos - Array of video objects
 * @param {string} apiKey - User's Gemini API key
 * @returns {Promise<Object>} Map of video IDs to tags
 */
export async function geminiBatchTag(videos, apiKey) {
    if (!apiKey) {
        console.warn('No Gemini API key provided');
        return {};
    }

    if (!videos || videos.length === 0) {
        return {};
    }

    try {
        const prompt = buildBatchPrompt(videos);
        console.log('=== GEMINI PROMPT ===');
        console.log(prompt);
        console.log('====================');

        const response = await callGeminiAPI(prompt, apiKey);

        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('=== GEMINI RESPONSE ===');
        console.log(text);
        console.log('=======================');

        const tagMap = parseBatchResponse(response, videos);

        console.log(`Gemini batch tagged ${videos.length} videos`);
        return tagMap;
    } catch (error) {
        console.error('Error in geminiBatchTag:', error);
        return {};
    }
}

/**
 * Build the prompt for Gemini API (single video)
 * @param {Object} video - Video object
 * @returns {string} Formatted prompt
 */
function buildPrompt(video) {
    return `Given this YouTube video:
- URL: ${video.url}
- Title: ${video.title}
- Channel: ${video.channel || 'Unknown'}

Choose ONE broad category tag for this video. Use your knowledge of YouTube content.
Return ONLY a JSON array with a single tag string, e.g. ["Tech"] or ["Music"] or ["Gaming"]
Use broad, general categories. Avoid hyper-specific tags.`;
}

/**
 * Build batch prompt for multiple videos
 * @param {Array} videos - Array of video objects
 * @returns {string} Formatted prompt
 */
function buildBatchPrompt(videos) {
    const videoList = videos.map((v, i) =>
        `${i + 1}. Title: "${v.title}" | Channel: ${v.channel || 'Unknown'}`
    ).join('\n');

    return `Tag these ${videos.length} YouTube videos with ONE category tag each.

${videoList}

Guidelines:
- Choose descriptive category tags that accurately represent the video content
- Categories should be somewhat broad but still meaningful (e.g., "Programming", "Music Production", "Gaming", "Food & Cooking", "Science")
- Create new categories when videos don't fit existing ones - don't force videos into unrelated categories
- Try to reuse similar categories when appropriate, but prioritize accuracy over minimizing tag count
- Each video gets exactly ONE tag

Return ONLY a JSON array of ${videos.length} tag strings in the same order, e.g. ["Programming", "Music Production", "Gaming", "Food & Cooking"]`;
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
 * @returns {string[]} Array of tags (should be single tag for new prompt)
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

/**
 * Parse batch response to extract tags for each video
 * @param {Object} response - Gemini API response
 * @param {Array} videos - Original video array
 * @returns {Object} Map of video IDs to tag arrays
 */
function parseBatchResponse(response, videos) {
    try {
        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.warn('No text in Gemini batch response:', response);
            return {};
        }

        // Clean up the response
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json\s*/g, '');
        cleanText = cleanText.replace(/```\s*/g, '');
        cleanText = cleanText.trim();

        // Parse as JSON
        const tags = JSON.parse(cleanText);

        if (!Array.isArray(tags)) {
            console.warn('Gemini batch response is not an array:', tags);
            return {};
        }

        console.log('=== PARSING BATCH RESPONSE ===');
        console.log('Number of videos:', videos.length);
        console.log('Number of tags:', tags.length);

        // Map tags to video IDs
        const tagMap = {};
        videos.forEach((video, index) => {
            console.log(`Video ${index}: "${video.title}" (ID: ${video.id})`);
            if (index < tags.length && tags[index]) {
                const tag = typeof tags[index] === 'string' ? tags[index].trim() : null;
                if (tag) {
                    tagMap[video.id] = [tag]; // Single tag in array
                    console.log(`  -> Mapped to tag: "${tag}"`);
                } else {
                    console.log(`  -> No valid tag (tag was: ${tags[index]})`);
                }
            } else {
                console.log(`  -> No tag at index ${index}`);
            }
        });

        console.log('Final tagMap:', tagMap);
        console.log('==============================');

        return tagMap;
    } catch (error) {
        console.error('Error parsing Gemini batch response:', error);
        return {};
    }
}

export default geminiTag;
