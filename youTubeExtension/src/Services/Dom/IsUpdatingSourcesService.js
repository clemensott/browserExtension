import IsUpdatingIndicator from '../../components/IsUpdatingIndicator';
import ReactRenderer from '../../utils/ReactRenderer';
import Div from '../../components/Div';
import RootElement from '../../components/RootElement';


export default class IsUpdatingSourcesService {
    constructor({ domService, trackerService }) {
        this.domService = domService;
        this.trackerService = trackerService;

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
            this.beforeSearchRenderer.render(RootElement(Div), container);
            this.indicatorRenderer.render(
                RootElement(IsUpdatingIndicator, { trackerService: this.trackerService }),
                container,
            );
        } else {
            this.indicatorRenderer.unmount();
        }
    }

    start() {
        this.domService.masterHeadContainer.addEventListener(this.onHeaderContainer);
    }
}
