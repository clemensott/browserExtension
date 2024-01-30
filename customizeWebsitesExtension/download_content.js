(function () {
    const downloads = new Map();

    function formatSize(size) {
        return `${(size / 1024 / 1024).toFixed(0)} MB`;
    }

    function startDownload(id, fileName, type) {
        downloads.set(id, {
            data: [],
            fileName,
            type,
        });
    }

    function addDownloadData(id, data) {
        const download = downloads.get(id);
        Object.values(data).forEach(byte => download.data.push(byte));
    }

    function finishDownload(id) {
        const download = downloads.get(id);
        const blob = new Blob([new Uint8Array(download.data)], { type: download.type });
        const dataUrl = URL.createObjectURL(blob)

        const link = document.createElement('a');
        link.setAttribute('href', dataUrl);
        link.setAttribute('download', download.fileName);
        link.click();

        URL.revokeObjectURL(dataUrl);
        downloads.delete(id);
    }

    browser.runtime.onMessage.addListener((msg) => {
        console.log('message:', msg.type);
        switch (msg.type) {
            case 'download_url_content_size':
                alert(`Size of "${msg.fileName}" is ${formatSize(msg.size)}.\nThis could take some time to download.`);
                break;
            case 'download_url_content_start':
                startDownload(msg.downloadId, msg.fileName, msg.contentType);
                break;
            case 'download_url_content_data':
                if (msg.data) {
                    addDownloadData(msg.downloadId, msg.data);
                }
                if (msg.finished) {
                    finishDownload(msg.downloadId);
                }
                break;
        }

        return false;
    });

})();