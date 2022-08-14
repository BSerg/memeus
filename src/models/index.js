import mongoose from 'mongoose';

import {UserSchema} from './UserModel';
import {PostSchema} from './PostModel';

export let User = mongoose.model('User', UserSchema);
export let Post = mongoose.model('Post', PostSchema);