// import moment from 'moment';


export function processPost(post) {
    let processedPost = {...post};
    // processedPost.date = moment(post.createdAt).format('DD:MM:YYYY HH:mm');
    return processedPost;
}

export function processPostItems(items) {
    return items.map((item) => { return processPost(item); })
}


export function processPostData(postData, user) {
    let _postData = {...postData};
    let author = _postData.author;
    delete _postData.author;
    if (user && author._id == user._id) {
        _postData.isOwner = true;
    }
    _postData.media.forEach(media => {
        ['original', 'default', 'preview'].forEach(field => {
            let mediaItem = media[field];
            if (mediaItem) {
                mediaItem.path = process.env.MEDIA_URL + mediaItem.path;
                media[field] = mediaItem;
            }
        })
    });
    
    return _postData;
};