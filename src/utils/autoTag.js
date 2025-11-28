export const autoTag = (video) => {
    const tags = [];
    const text = (video.title + ' ' + (video.description || '')).toLowerCase();

    const categories = {
        'Tech': ['programming', 'code', 'python', 'javascript', 'react', 'ai', 'gpt', 'computer', 'linux', 'developer', 'software', 'web'],
        'Politics': ['election', 'trump', 'biden', 'politics', 'democrat', 'republican', 'debate', 'policy', 'government'],
        'Entertainment': ['movie', 'trailer', 'game', 'gameplay', 'review', 'comedy', 'funny', 'music', 'song'],
        'Science': ['science', 'physics', 'space', 'biology', 'chemistry', 'math', 'research'],
        'Education': ['tutorial', 'how to', 'learn', 'course', 'lecture', 'university', 'school'],
        'News': ['news', 'report', 'update', 'breaking'],
        'Podcast': ['podcast', 'interview', 'episode']
    };

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            tags.push(category);
        }
    }

    return tags;
};
