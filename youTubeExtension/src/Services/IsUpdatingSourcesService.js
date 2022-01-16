import React from 'react';
import IsUpdatingIndicator from '../components/IsUpdatingIndicator';
import ReactRenderer from '../utils/ReactRenderer';


export default class IsUpdatingSourcesService {
    constructor({ domService }) {
        this.domService = domService;
        this.beforeSearchRenderer = new ReactRenderer({
            id: 'is_updating_sources_before_search',
            beforeSelector: '#center',
        });
        this.indicatorRenderer = new ReactRenderer({
            id: 'is_updating_sources_indicator_container',
            beforeSelector: '#end',
        });

        this.onHeaderContainer = this.onHeaderContainer.bind(this);
    }

    onHeaderContainer({ detail: { currentElements: container } }) {
        if (container) {
            this.beforeSearchRenderer.render(<div />, container);
            this.indicatorRenderer.render(<IsUpdatingIndicator />, container);
        } else {
            this.indicatorRenderer.unmount();
        }
    }

    start() {
        this.domService.masterHeadContainer.addEventListener(this.onHeaderContainer);
    }
}
