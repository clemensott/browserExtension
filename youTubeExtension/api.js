importIntoWebsite(function () {
    class API {
        constructor(username, password, baseUrl) {
            this.username = username;
            this.password = password;
            this.baseUrl = baseUrl;
        }

        call({ url, method = 'POST', body }) {
            return window.fetch(this.baseUrl + url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: method !== 'GET' ? JSON.stringify({
                    username: this.username,
                    password: this.password,
                    ...body,
                }) : undefined,
            });
        }

        async expectOk(promise) {
            const response = await promise;
            if (response.ok) {
                return response;
            }
            throw new Error(`Request error. Status: ${response.status}`);
        }

        async toJSON(promise) {
            const response = await this.expectOk(promise);
            return JSON.parse(await response.text());
        }

        async ping() {
            const response = await this.call({
                url: '/api/ping',
                method: 'GET'
            });
            return response.ok;
        }

        videoUserState(videoIds) {
            return this.toJSON(this.call({
                url: '/api/videos/userState',
                body: {
                    videoIds,
                }
            }));
        }

        sourceFromYoutubeIds(youTubeIds) {
            return this.toJSON(this.call({
                url: '/api/sources/fromYoutubeIds',
                body: {
                    youTubeIds,
                },
            }));
        }

        sourceAdd(youTubeId, isActive) {
            return this.toJSON(this.call({
                url: '/api/sources/add',
                body: {
                    youTubeId,
                    isActive,
                }
            }));
        }

        sourceUpdate(sources) {
            return this.expectOk(this.call({
                url: '/api/sources/update',
                method: 'PUT',
                body: {
                    sources,
                },
            }));
        }

        videoUpdateThumbnails(videoIds) {
            return this.toJSON(this.call({
                url: '/api/videos/updateThumbnails',
                body: {
                    videoIds,
                }
            }));
        }

        putVideoUserState(videoId, isWatched) {
            return this.toJSON(this.call({
                url: `/api/videos/userState/${videoId}`,
                method: 'PUT',
                body: {
                    isWatched,
                },
            }));
        }

        putVideoSourceState(videoId, sourceIds, isActive, isActiveDeprecated) {
            return this.expectOk(this.call({
                url: `/api/videos/sourcesState/${videoId}`,
                method: 'PUT',
                body: {
                    sourceIds,
                    isActive,
                    isActiveDeprecated,
                },
            }));
        }

        deleteVideo(videoId, sourceIds) {
            return this.expectOk(this.call({
                url: `/api/videos/${videoId}`,
                method: 'DELETE',
                body: {
                    sourceIds,
                },
            }));
        }
    }

    return {
        API,
    };
});