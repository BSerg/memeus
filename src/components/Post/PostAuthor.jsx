import React from 'react';
import {Link} from 'react-router-dom';

import './styles/PostAuthor.scss';

export function PostAuthor({post}) {
    if (!post || !post.author || !post.author.nickname) {
        return null;
    }

    const avatar = post.author.avatar && post.author.avatar.path;
    return <Link className="post__author" to={`/u/${post.author.nickname}`}>
        { avatar && <img src={avatar} alt=""/> }
        <span>{post.author.nickname}</span>
    </Link>
}

export default PostAuthor;