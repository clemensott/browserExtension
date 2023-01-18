async function main() {
    while (typeof map === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    function createSlider({ min, max, value, step, sliderValueFormatter, onValueChange }) {
        if (typeof sliderValueFormatter === 'undefined') {
            sliderValueFormatter = String;
        }
        const p = document.createElement('p');
        p.value = typeof value !== 'undefined' ? value : 0;
        p.innerText = sliderValueFormatter(p.value);

        const slider = document.createElement('input');
        slider.type = 'range';
        if (typeof min !== 'undefined') {
            slider.min = min;
        }
        if (typeof max !== 'undefined') {
            slider.max = max;
        }
        if (typeof value !== 'undefined') {
            slider.value = value;
        }
        if (typeof step !== 'undefined') {
            slider.step = step;
        }
        slider.addEventListener('change', () => {
            p.innerText = sliderValueFormatter(slider.value);
            onValueChange(parseFloat(slider.value));
        });

        const div = document.createElement('div');
        div.classList.add('slider');
        div.appendChild(slider);
        div.appendChild(p);

        return { slider: div };
    }

    function createRenderDatePickerControls({ onPlayPauseClick, onResetClick, onSetClick }) {
        const datetimePicker = document.createElement('input');
        datetimePicker.type = 'datetime-local';
        datetimePicker.classList.add('dny-start-datetime-picker');

        const renderDateTime = document.createElement('div');
        renderDateTime.innerText = new Date(datetimePicker.value).toLocaleString();

        const playPauseButton = document.createElement('button');
        playPauseButton.innerText = 'Play';
        playPauseButton.addEventListener('click', onPlayPauseClick);

        const resetButton = document.createElement('button');
        resetButton.innerText = 'From Picker';
        resetButton.addEventListener('click', onResetClick);

        const setButton = document.createElement('button');
        setButton.innerText = 'To Picker';
        setButton.addEventListener('click', onSetClick);

        const playPauseContainer = document.createElement('div');
        playPauseContainer.classList.add('play-pause-container');
        playPauseContainer.appendChild(playPauseButton);
        playPauseContainer.appendChild(resetButton);
        playPauseContainer.appendChild(setButton);

        const container = document.createElement('div');
        container.appendChild(datetimePicker);
        container.appendChild(renderDateTime);
        container.appendChild(playPauseContainer);

        return {
            container,
            getPickedDateTime: () => new Date(datetimePicker.value),
            setPickedDateTime: v => datetimePicker.value = new Date(v).toISOString().substring(0, 19),
            setRenderDateTime: v => renderDateTime.innerText = new Date(v).toLocaleString(),
        };
    }

    function createUI({ onPlayPauseClick, onResetClick, onSetClick, speed, onSpeedChange }) {
        const header = document.createElement('b');
        header.innerText = 'TrainScrapings';

        const {
            container: renderDateTimeControls,
            getPickedDateTime,
            setPickedDateTime,
            setRenderDateTime,
        } = createRenderDatePickerControls({ onPlayPauseClick, onResetClick, onSetClick });
        const { slider } = createSlider({
            min: 10,
            max: 500,
            value: speed,
            step: 1,
            sliderValueFormatter: v => `${v}x`,
            onValueChange: onSpeedChange,
        });

        const container = document.createElement('div');
        container.id = 'dnyBar';
        container.appendChild(header);
        container.appendChild(renderDateTimeControls);
        container.appendChild(slider);

        const sideBar = document.querySelector("#sideBar");
        sideBar.appendChild(container);

        return {
            getPickedDateTime,
            setPickedDateTime,
            setRenderDateTime,
        };
    }

    const renderDateTimeKey = 'train_scraping_render_datetime';
    const renderSpeedKey = 'train_scraping_render_speed';
    const api = new Api(
        localStorage.getItem('dny_api_url'),
        localStorage.getItem('dny_api_token'),
    );
    const loader = new DnyLoader(api);
    const renderer = new DnyRenderer(map);

    let renderIntervalId = null;
    let speed = parseInt(localStorage.getItem(renderSpeedKey), 10) || 60;
    let renderDateTime = null;
    let lastLoop = null;
    let lastDny = null;

    if (!await api.ping()) {
        console.log('ping train scraping api failed');
        return;
    }

    const { getPickedDateTime, setPickedDateTime, setRenderDateTime } = createUI({
        onPlayPauseClick: onPlayPause,
        onResetClick: onResetRenderDateTime,
        onSetClick: onSetRenderDateTime,
        speed,
        onSpeedChange,
    });
    setPickedDateTime(parseInt(localStorage.getItem(renderDateTimeKey), 10) || Date.now());
    onResetRenderDateTime();

    async function renderLoop() {
        const now = Date.now();
        if (lastLoop) {
            renderDateTime += (now - lastLoop) * speed;
            setRenderDateTime(renderDateTime);
        }
        lastLoop = now;

        const dny = await loader.getDnyAfter(renderDateTime);
        if (dny && lastDny !== dny) {
            const startRender = Date.now();
            renderer.render(dny);
            lastDny = dny;
        }
    }

    function onPlayPause({ target }) {
        if (renderIntervalId) {
            clearInterval(renderIntervalId);
            renderIntervalId = null;
            target.innerText = 'Play';
            lastLoop = null;
        } else {
            renderIntervalId = setInterval(renderLoop, 100);
            target.innerText = 'Pause';
        }
    }

    async function onResetRenderDateTime() {
        renderDateTime = getPickedDateTime().getTime();
        setRenderDateTime(renderDateTime);
        lastLoop = null;

        localStorage.setItem(renderDateTimeKey, renderDateTime);
    }

    function onSetRenderDateTime() {
        setPickedDateTime(renderDateTime);
    }

    function onSpeedChange(value) {
        speed = value;
        localStorage.setItem(renderSpeedKey, speed);
    }
}
