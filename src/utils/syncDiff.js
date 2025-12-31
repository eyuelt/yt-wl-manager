/**
 * Compute differences between local and Drive data
 */

export function computeSyncDiff(localData, driveData, direction) {
    const local = localData || { videos: [], tags: {}, metadata: {} };
    const drive = driveData || { videos: [], tags: {}, metadata: {} };

    const source = direction === 'to-drive' ? local : drive;
    const target = direction === 'to-drive' ? drive : local;

    // Create maps for easier lookup
    const sourceVideosMap = new Map(source.videos.map(v => [v.id, v]));
    const targetVideosMap = new Map(target.videos.map(v => [v.id, v]));

    const sourceVideoIds = new Set(source.videos.map(v => v.id));
    const targetVideoIds = new Set(target.videos.map(v => v.id));

    // Videos added/removed
    const videosAdded = source.videos.filter(v => !targetVideoIds.has(v.id)).length;
    const videosRemoved = target.videos.filter(v => !sourceVideoIds.has(v.id)).length;

    // Videos with metadata changes (title, channel, thumbnail, etc.)
    let videosWithMetadataChanges = 0;
    const commonVideoIds = [...sourceVideoIds].filter(id => targetVideoIds.has(id));

    for (const videoId of commonVideoIds) {
        const sourceVideo = sourceVideosMap.get(videoId);
        const targetVideo = targetVideosMap.get(videoId);

        // Compare relevant fields (excluding lastSync which is expected to differ)
        const sourceData = {
            title: sourceVideo.title,
            channel: sourceVideo.channel,
            thumbnail: sourceVideo.thumbnail,
            url: sourceVideo.url,
            archived: sourceVideo.archived
        };
        const targetData = {
            title: targetVideo.title,
            channel: targetVideo.channel,
            thumbnail: targetVideo.thumbnail,
            url: targetVideo.url,
            archived: targetVideo.archived
        };

        if (JSON.stringify(sourceData) !== JSON.stringify(targetData)) {
            videosWithMetadataChanges++;
        }
    }

    // Tag differences (count unique tag names)
    const sourceTagNames = new Set();
    Object.values(source.tags).forEach(tagArray => {
        tagArray.forEach(tag => sourceTagNames.add(tag));
    });

    const targetTagNames = new Set();
    Object.values(target.tags).forEach(tagArray => {
        tagArray.forEach(tag => targetTagNames.add(tag));
    });

    const tagsAdded = [...sourceTagNames].filter(tag => !targetTagNames.has(tag)).length;
    const tagsRemoved = [...targetTagNames].filter(tag => !sourceTagNames.has(tag)).length;

    // Count videos with tag changes
    let videosWithTagChanges = 0;
    const allVideoIds = new Set([...Object.keys(source.tags), ...Object.keys(target.tags)]);

    for (const videoId of allVideoIds) {
        const sourceTags = JSON.stringify((source.tags[videoId] || []).sort());
        const targetTags = JSON.stringify((target.tags[videoId] || []).sort());
        if (sourceTags !== targetTags) {
            videosWithTagChanges++;
        }
    }

    return {
        direction,
        videosAdded,
        videosRemoved,
        videosWithMetadataChanges,
        tagsAdded,
        tagsRemoved,
        videosWithTagChanges,
        hasChanges: videosAdded > 0 || videosRemoved > 0 || videosWithMetadataChanges > 0 || tagsAdded > 0 || tagsRemoved > 0 || videosWithTagChanges > 0
    };
}
