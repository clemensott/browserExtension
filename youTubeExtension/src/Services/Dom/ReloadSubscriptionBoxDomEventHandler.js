import React from 'react';
import ReloadCheckbox from '../../components/ReloadCheckbox';
import ReactRenderer from '../../utils/ReactRenderer';
import DomEventHandler from './DomEventHandler';


export default class ReloadSubscriptionBoxDomEventHandler extends DomEventHandler {
    constructor(options) {
        super({
            eventName: 'SubscriptionBoxDomEventHandler.change',
            elementsGetter: ReloadSubscriptionBoxDomEventHandler.getContainer,
            timeout: 10000,
            notFoundTimeout: 500,
            triggerEventOnRunChange: true,
        });

        this.options = options;
        this.reloadIndicatorRenderer = new ReactRenderer({
            id: 'reload_subscription_box_container',
            beforeSelector: '#spacer',
        });
    }

    static getContainer() {
        return document.querySelector('#title-container');
    }

    getReloadingSeconds() {
        return this.options.subscriptionBoxReloadSeconds;
    }

    getReloadingEnabled() {
        return this.options.isSubscriptionBoxReloadEnabled;
    }

    onChangeReloadEnabled(enabled) {
        this.options.isSubscriptionBoxReloadEnabled = !!enabled;
    }

    onChange({ currentElements: container }) {
        if (container) {
            this.reloadIndicatorRenderer.render(
                <ReloadCheckbox
                    runDownSeconds={this.getReloadingSeconds()}
                    defaultChecked={this.getReloadingEnabled()}
                    onChange={this.onChangeReloadEnabled.bind(this)}
                />, container);
        } else {
            this.reloadIndicatorRenderer.unmount();
        }
    }
}
