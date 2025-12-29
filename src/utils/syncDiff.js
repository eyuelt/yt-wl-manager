/**
 * Compute differences between local and Drive data
 */

export function computeSyncDiff(localData, driveData, direction) {
    const local = localData || { videos: [], tags: {}, metadata: {} };
    const drive = driveData || { videos: [], tags: {}, metadata: {} };

    const source = direction === 'to-drive' ? local : drive;
    const target = direction === 'to-drive' ? drive : local;

    // Video differences
    const sourceVideoIds = new Set(source.videos.map(v => v.id));
    const targetVideoIds = new Set(target.videos.map(v => v.id));

    const videosAdded = source.videos.filter(v => !targetVideoIds.has(v.id)).length;
    const videosRemoved = target.videos.filter(v => !sourceVideoIds.has(v.id)).length;

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
        tagsAdded,
        tagsRemoved,
        videosWithTagChanges,
        hasChanges: videosAdded > 0 || videosRemoved > 0 || tagsAdded > 0 || tagsRemoved > 0 || videosWithTagChanges > 0
    };
}
