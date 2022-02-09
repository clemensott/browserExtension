import React from 'react';
import ReloadCheckbox from '../../components/ReloadCheckbox';
import ReactRenderer from '../../utils/ReactRenderer';
import DomEventHandler from './DomEventHandler';


export default class ReloadSubscriptionBoxDomEventHandler extends DomEventHandler {
    constructor() {
        super({
            eventName: 'SubscriptionBoxDomEventHandler.change',
            elementsGetter: ReloadSubscriptionBoxDomEventHandler.getContainer,
            timeout: 10000,
            notFoundTimeout: 500,
            triggerEventOnRunChange: true,
        });

        this.reloadIndicatorRenderer = new ReactRenderer({
            id: 'reload_subscription_box_container',
            beforeSelector: '#spacer',
        });
    }

    static getContainer() {
        return document.querySelector('#title-container');
    }

    getReloadingSeconds() {
        return Number(localStorage.getItem('subscriptionBoxReloadSeconds')) || 300;
    }

    getReloadingEnabled() {
        return localStorage.getItem('subscriptionBoxReloadEnabled') == true;
    }

    onChangeReloadEnabled(enabled) {
        localStorage.setItem('subscriptionBoxReloadEnabled', enabled ? 1 : 0);
    }

    onChange({ currentElements: container }) {
        if (container) {
            this.reloadIndicatorRenderer.render(
                <ReloadCheckbox
                    runDownSeconds={this.getReloadingSeconds()}
                    defaultChecked={this.getReloadingEnabled()}
                    onChange={this.onChangeReloadEnabled}
                />, container);
        } else {
            this.reloadIndicatorRenderer.unmount();
        }
    }
}
