async function loadLiveDny(bounds) {
    const minx = bounds.getWest().toFixed(6).replace('.', '');
    const miny = bounds.getSouth().toFixed(6).replace('.', '');
    const maxx = bounds.getEast().toFixed(6).replace('.', '');
    const maxy = bounds.getNorth().toFixed(6).replace('.', '');
    const url = `http://zugradar.oebb.at/bin/query.exe/dny?look_minx=${minx}&look_maxx=${miny}&look_miny=${maxx}&look_maxy=${maxy}&tpl=trains2json2&look_productclass=63&look_json=yes&performLocating=1&look_nv=get_zntrainname|no|zugposmode|2|interval|30000|intervalstep|2000|maxnumberoftrains|500|`;
    const res = await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
    });
    if (res.ok) {
        return res.json();
    }
    return null;
}

function main() {
    console.log('main:', typeof Api, typeof DnyLoader, typeof DnyRenderer);
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
        datetimePicker.classList.add('dny-start-datetime-picker')
        datetimePicker.value = new Date().toISOString().substring(0, 19);

        const renderDateTime = document.createElement('div');
        renderDateTime.innerText = new Date(datetimePicker.value).toLocaleString();

        const playPauseButton = document.createElement('button');
        playPauseButton.innerText = 'Play';
        playPauseButton.addEventListener('click', onPlayPauseClick);

        const resetButton = document.createElement('button');
        resetButton.innerText = 'Reset';
        resetButton.addEventListener('click', onResetClick);

        const setButton = document.createElement('button');
        setButton.innerText = 'Set';
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
            setRenderDateTime,
        };
    }

    const api = new Api(
        localStorage.getItem('dny_api_url'),
        localStorage.getItem('dny_api_username'),
        localStorage.getItem('dny_api_password'),
    );
    const loader = new DnyLoader(api);
    const renderer = new DnyRenderer(map);

    let renderIntervalId = null;
    let speed = 60;
    let renderDateTime = null;
    let lastLoop = null;
    let lastDny = null;

    const { getPickedDateTime, setRenderDateTime } = createUI({
        onPlayPauseClick: onPlayPause,
        onResetClick: onResetRenderDateTime,
        onSetClick: onSetRenderDateTime,
        speed,
        onSpeedChange,
    });
    onResetRenderDateTime();

    async function renderLoop() {
        const now = Date.now();
        if (lastLoop) {
            renderDateTime += (now - lastLoop) * speed;
        }
        lastLoop = now;

        const dny = await loader.getDnyAfter(renderDateTime, speed);
        if (dny && lastDny !== dny) {
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
        console.log('reset');

        renderDateTime = getPickedDateTime().getTime();
        lastLoop = null;
        loader.clear();
    }

    function onSetRenderDateTime() {
        console.log('set');

        setRenderDateTime(renderDateTime);
    }

    function onSpeedChange(value) {
        speed = value;
    }
}
