import React from 'react';
import IsUpdatingIndicator from '../components/IsUpdatingIndicator';
import ReactRenderer from '../utils/ReactRenderer';
import DomEventService from './DomEventService';


export default class IsUpdatingSourcesService {
    constructor() {
        this.domService = DomEventService.getInstance();
        this.renderer = new ReactRenderer({
            id: 'is_updating_sources_indicator_container',
            beforeSelector: '#end',
        });

        this.onHeaderContainer = this.onHeaderContainer.bind(this);
    }

    onHeaderContainer({ detail: { currentElements: container } }) {
        if (container) {
            this.renderer.render(<IsUpdatingIndicator />, container);
        } else {
            this.renderer.unmount();
        }
    }

    start() {
        this.domService.masterHeadContainer.addEventListener(this.onHeaderContainer);
    }
}
