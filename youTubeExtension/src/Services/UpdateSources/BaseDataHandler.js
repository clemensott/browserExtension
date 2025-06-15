import tryIgnore from '../../utils/tryIgnore';
import * as converters from './VideoDataConverters';

const converterList = Array.from(Object.values(converters));

class BaseDataHandler {
    constructor({ name, getVideosFuncs, getAdditionalData, preConverter }) {
        this.name = name;
        this.getVideosFuncs = getVideosFuncs.map(getVideosFunc => (
            data => tryIgnore(() => getVideosFunc(data))
        ));
        this.getAdditionalData = getAdditionalData || (() => ({}));
        this.preConverter = preConverter;
    }

    getVideos(data) {
        for (const getVideosFunc of this.getVideosFuncs) {
            const rawVideos = getVideosFunc(data)?.filter(Boolean);
            if (rawVideos && rawVideos.length) {
                return rawVideos;
            }
        }
        return null;
    }

    preConvert(rawVideos) {
        return typeof this.preConverter === 'function' &&
            tryIgnore(() => this.preConverter(rawVideos)) || rawVideos;
    }

    convertVideo(raw, additionalData) {
        for (const converter of converterList) {
            const video = converter(raw, additionalData);
            if (video) {
                return video;
            }
        }
        return null;
    }

    extractVideos(data) {
        const rawVideos = this.getVideos(data);
        const additionalData = tryIgnore(() => this.getAdditionalData(data));
        if (rawVideos && rawVideos.length && additionalData) {
            const preConverted = this.preConvert(rawVideos);
            const videos = preConverted
                .filter(Boolean)
                .map(raw => this.convertVideo(raw, additionalData));
            return videos
                .filter(Boolean)
                .filter(v => v.id && v.channelId);
        }
        return null;
    }
}

export default BaseDataHandler;
