const domTagName = 'ytd-consent-bump-v2-lightbox';

function closeConsentLightBox(lightbox) {
    lightbox.dialog.close();
    lightbox.resumePlayer();
    document.body.classList.add('hideConsentLightBox');
}

export function subsribeConsentLightBoxRemove() {
    const mutationObserver = new MutationObserver(records => records.forEach(record => {
        record.addedNodes.forEach(addedNode => {
            if (addedNode.tagName?.toLowerCase() === domTagName) {
                closeConsentLightBox(addedNode);
            }
        })
    }));
    mutationObserver.observe(document.querySelector('ytd-app'), {
        subtree: false,
        childList: true,
        attributes: false,
    });

    const outerLightbox = document.querySelector(domTagName);
    if (outerLightbox) {
        closeConsentLightBox(outerLightbox);
    }
}
