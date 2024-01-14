(function () {
    function getCurrentSearchTerm() {
        return new URLSearchParams(location.search).get('q');
    }

    function copyDataAttributes(src, dest) {
        Object.entries(src?.dataset || {}).forEach(([key, value]) => {
            if (key.match(/^v[\-A-Z]/)) {
                dest.dataset[key] = value;
            }
        });
    }

    function createStartpageListElement(otherElement) {
        const icon = document.createElement('div');
        icon.style.width = '24px';
        icon.style.height = '24px';
        copyDataAttributes(otherElement.querySelector('svg'), icon);

        const text = document.createTextNode('Startpage');

        const a = document.createElement('a');
        a.href = `https://www.startpage.com/do/search?q=${getCurrentSearchTerm()}`;
        a.target = '_blank';
        a.rel = 'noopener';
        a.role = 'menuitem';
        a.classList.add('search-navigation__dropdown-link');
        copyDataAttributes(otherElement.querySelector('a'), a);
        a.appendChild(icon);
        a.appendChild(text);

        const span = document.createElement('span');
        span.classList.add('list-item__content');
        copyDataAttributes(otherElement.querySelector('span'), span);
        span.appendChild(a);

        const li = document.createElement('li');
        li.classList.add('list-item', 'list-item--transition', 'list-item--content-style');
        copyDataAttributes(otherElement, li);
        li.appendChild(span);

        return li;
    }

    const moreContainer = document.querySelector('div[data-test-id="search-navigation-more"]');
    const moreButton = moreContainer.querySelector('a');
    moreButton.addEventListener('click', () => {
        const list = moreContainer.querySelector('ul.list');
        list.appendChild(createStartpageListElement(list.firstChild));
    });
})();
