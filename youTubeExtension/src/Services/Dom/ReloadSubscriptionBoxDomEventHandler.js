import ReloadCheckbox from '../../components/ReloadCheckbox';
import RootElement from '../../components/RootElement';
import ReactRenderer from '../../utils/ReactRenderer';
import tryReloadSubscriptions from '../../utils/tryReloadSubscriptions';
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
        this.reloadTimeoutId = null;
    }

    static getContainer() {
        return document.querySelector('#title-container:not([hidden])');
    }

    start() {
        super.start();

        this.startBackupReload();
    }

    startBackupReload() {
        clearTimeout(this.reloadTimeoutId);
        this.reloadTimeoutId = setTimeout(() => {
            if (this.getReloadingEnabled() && !this.elementsExists(this.currentElements)) {
                this.reloadTimeoutId = setTimeout(tryReloadSubscriptions, this.getReloadingSeconds() * 1000);
            }
        }, 5000);
    }

    stop() {
        super.stop();

        clearTimeout(this.reloadTimeoutId);
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
                RootElement(ReloadCheckbox, {
                    runDownSeconds: this.getReloadingSeconds(),
                    defaultChecked: this.getReloadingEnabled(),
                    onChange: this.onChangeReloadEnabled.bind(this),
                }), container);
            clearTimeout(this.reloadTimeoutId);
        } else {
            this.reloadIndicatorRenderer.unmount();
            this.startBackupReload();
        }
    }
}
