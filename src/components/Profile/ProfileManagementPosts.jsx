import React, {Component} from 'react';
import PostList from 'components/PostList/PostList';


export class ProfileManagementPosts extends Component {
    render() {
        return <PostList type="my" adsEnabled={false}/>
    
    }
}

export default ProfileManagementPosts;