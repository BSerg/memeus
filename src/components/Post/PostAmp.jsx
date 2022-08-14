import React from 'react';
import {SOCIAL_LINKS, MOBILE_LINKS} from './PostShare';

import LikeIcon from './images/like.svg';
import DislikeIcon from './images/dislike.svg';

export function PostAmpContent({post}) {
    switch(post.media[0].type) {
        case('photo'):
            return <div dangerouslySetInnerHTML={{
                __html: `<amp-img src="${post.media[0].default.path}" width="${post.media[0].default.width}" 
                    height="${post.media[0].default.height}" layout="responsive" alt="">
                </amp-img>`}} />;

        case('animation'):
            return <div dangerouslySetInnerHTML={{
                __html: `<amp-video width="${post.media[0].default.width}" 
                            height="${post.media[0].default.height}" 
                            layout="responsive" alt="" 
                            poster="${post.media[0].preview.path}" loop autoplay>
                            <source src="${post.media[0].default.path}" type="video/mp4" />
                            <div fallback>
                                <p>Animation not supported</p>
                            </div>
                        </amp-video>`}}/>;
        
        default:
            return null;
    }
}

export function PostAmpLikes({data}) {
    return <div className="post_likes">
        <a href={data.canonicalUrl} alt="" dangerouslySetInnerHTML={{
            __html: `<amp-img src="${LikeIcon}" width=20 height=20 layout="responsive"></amp-img>`}}/>
        {data.likes}
        <a href={data.canonicalUrl} alt="" dangerouslySetInnerHTML={{
            __html: `<amp-img src="${DislikeIcon}" width=20 height=20 layout="responsive"></amp-img>`}}/>
    </div>
}

export function PostShareLinksAmp({url, items}) {
    return items.map((item) => {
        return <a className={`post_share__link ${item.className}`}
                  href={item.href + url} target='_blank' 
                  key={item.key} dangerouslySetInnerHTML={{
                      __html: `<amp-img src=${item.icon} layout="responsive" width="35" height="35" alt=""></amp-img>`}} />;
    })
}

export function PostAmpShare({post}) {
    return <div className="post_share">
        <div className="post_share__row"><PostShareLinksAmp items={SOCIAL_LINKS}/></div>
        <div className="post_share__row"><PostShareLinksAmp items={MOBILE_LINKS}/></div>
    </div>
}



export default function PostAmp({data}) {
    return <div id="content">
        {data.post.caption && <h2>{ data.post.caption }</h2>}
        <PostAmpContent post={data.post} />
        <PostAmpLikes data={data}/>
        <PostAmpShare post={data.post}/>
    </div>
}
