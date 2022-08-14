import mongoose from 'mongoose';
import util from 'util';

mongoose.Promise = Promise;

export function BaseMediaFileSchema() {
    mongoose.Schema.apply(this, arguments);

    this.add({
        path: String,
        width: Number,
        height: Number,
        format: String,
        size: Number
    })
}

util.inherits(BaseMediaFileSchema, mongoose.Schema);

export const MediaFileSchema = new BaseMediaFileSchema();

MediaFileSchema.virtual('fullPath').get(function() {
    return process.env.MEDIA_URL + this.path;
});

export default mongoose.model('MediaFile', MediaFileSchema);