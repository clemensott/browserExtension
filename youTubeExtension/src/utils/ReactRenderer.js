import ReactDOM from 'react-dom';


export default class ReactRenderer {
    constructor({ type = 'div', className = '', id = '', beforeSelector }) {
        this.container = {
            type,
            className,
            id,
        };
        this.beforeSelector = beforeSelector;

        this.lastContainer = null;
        this.renderInfo = null;
        this.observer = new MutationObserver(() => {
            if (this.renderInfo && !document.body.contains(this.lastContainer)) {
                this.render(this.renderInfo.element, this.renderInfo.base);
            }
        });
    }

    getContainer(base) {
        const { type, className, id } = this.container;
        const idSelector = id ? `#${id}` : '';
        const classNameSelector = className ? className.split(' ').filter(Boolean).map(c => `.${c}`).join('') : '';
        const selector = `${type}${idSelector}${classNameSelector}`;

        return base.querySelector(selector);
    }

    getOrCreateContainer(base) {
        let containerElement = this.getContainer(base);
        if (!containerElement) {
            const { type, className, id } = this.container;
            containerElement = document.createElement(type);
            containerElement.className = className;
            containerElement.id = id;
        }

        return containerElement;
    }

    render(element, base) {
        const containerElement = this.getOrCreateContainer(base);

        if (this.lastContainer && this.lastContainer !== containerElement) {
            this.unmount();
        }

        ReactDOM.render(element, containerElement);
        this.lastContainer = containerElement;

        if (!document.contains(containerElement)) {
            if (typeof this.beforeSelector === 'string') {
                const beforeNode = Array.from(base.querySelectorAll(this.beforeSelector))
                    .find(node => node.parentElement === base);
                base.insertBefore(containerElement, beforeNode);
            } else {
                base.appendChild(containerElement);
            }
        }

        this.renderInfo = {element, base};
        this.observer.observe(containerElement.parentElement, { childList: true })
    }

    unmount() {
        if (this.lastContainer) {
            ReactDOM.unmountComponentAtNode(this.lastContainer);
            this.renderInfo = null;
            this.observer.disconnect();
        }
    }
}