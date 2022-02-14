import React, { useRef, useEffect, useState } from 'react';
import StorageService from '../../Services/StorageService';
import OptionsService from '../../Services/OptionsService';
import API from '../../Services/API';
import './App.css';

const options = new OptionsService(new StorageService());

async function pingApi(baseUrl) {
    try {
        const url = new URL(baseUrl);
        const api = new API(null, null, baseUrl);
        return !!url && await api.ping()
    } catch {
        return false;
    }
}

export default function App() {
    const [enableDomManipulation, setEnableDomManipulation] = useState(false);
    const [enableVideoPlayerManipulation, setEnableVideoPlayerManipulation] = useState(true);
    const [apiBaseUrl, setApiBaseUrl] = useState();
    const [apiBaseUrlValid, setApiBaseUrlValid] = useState(true);
    const [apiUsername, setApiUsername] = useState();
    const [apiPassword, setApiPassword] = useState();
    const enableEndVideoButton = useRef();
    const subscriptionboxReloadSeconds = useRef();

    const checkBaseUrlValid = async url => {
        setApiBaseUrlValid(await pingApi(url));
    }

    useEffect(() => {
        (async () => {
            await options.load();
            setEnableVideoPlayerManipulation(!!options.isVideoPlayerManipulationEnabled);
            setApiBaseUrl(options.apiBaseUrl);
            setApiUsername(options.apiUsername);
            setApiPassword(options.apiPassword);
            checkBaseUrlValid(options.apiBaseUrl);
        })();
    }, [options]);

    useEffect(() => {
        checkBaseUrlValid(apiBaseUrl);
    }, [apiBaseUrl, apiUsername, apiPassword]);

    const saveOptions = () => {
        options.isDomManipulationEnabled = !!enableDomManipulation;
        options.subscriptionBoxReloadSeconds = parseInt(subscriptionboxReloadSeconds.current.value, 10);

        options.isVideoPlayerManipulationEnabled = !!enableVideoPlayerManipulation;
        options.isEndVideoButtonEnabled = !!enableEndVideoButton.current.checked;

        options.apiBaseUrl = apiBaseUrl;
        options.apiUsername = apiUsername;
        options.apiPassword = apiPassword;
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <h1>YouTube Extension Options</h1>
            </div>

            <div className="form-section">
                <h2>User Interface Manipulation</h2>

                <div className="info-text">
                    Adds various additional elements to user interface.
                </div>

                <div className="form-group">
                    <input
                        id="enable-dom-manipulation"
                        type="checkbox"
                        checked={enableDomManipulation}
                        onChange={e => setEnableDomManipulation(e.target.checked)}
                    />
                    <label htmlFor="enable-dom-manipulation">Enable various user interface manipulations</label>
                </div>

                <div className="form-group">
                    <label htmlFor="subscriptionbox-reload-time">Subscription box reload countdown in seconds</label>
                    <input
                        ref={subscriptionboxReloadSeconds}
                        id="subscriptionbox-reload-time"
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        defaultValue={options.subscriptionBoxReloadSeconds}
                        disabled={!enableDomManipulation}
                    />
                </div>
            </div>

            <div className="form-section">
                <h2>Video Player Manipulation</h2>

                <div className="info-text">
                    Fast forwards, mutes and turn ads black.
                </div>

                <div className="form-group">
                    <input
                        id="enable-player-manipulation-video-button"
                        type="checkbox"
                        checked={enableVideoPlayerManipulation}
                        onChange={e => setEnableVideoPlayerManipulation(e.target.checked)}
                    />
                    <label htmlFor="enable-player-manipulation-video-button">Enable video player manipulation</label>
                </div>

                <div className="form-group">
                    <input
                        ref={enableEndVideoButton}
                        id="enable-end-video-button"
                        type="checkbox"
                        defaultChecked={options.isEndVideoButtonEnabled}
                        disabled={!enableVideoPlayerManipulation}
                    />
                    <label htmlFor="enable-end-video-button">Enable end video button</label>
                </div>
            </div>

            <div className="form-section">
                <h2>API</h2>

                <div className="info-text">
                    Provides additional features like marking videos as watched and video scraping.
                    Disabled if not filled out.
                </div>

                <div className="form-group">
                    <label htmlFor="api-base-url">Base URL</label>
                    <input
                        id="api-base-url"
                        type="text"
                        className={`form-control ${apiBaseUrlValid ? '' : 'form-error'}`}
                        defaultValue={apiBaseUrl}
                        onChange={async e => setApiBaseUrl(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="api-username">Username</label>
                    <input
                        id="api-username"
                        type="text"
                        className={`form-control ${!apiBaseUrlValid || apiUsername ? '' : 'form-error'}`}
                        defaultValue={apiUsername}
                        onChange={async e => setApiUsername(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="api-password">Password</label>
                    <input
                        id="api-username"
                        type="text"
                        className={`form-control ${!apiBaseUrlValid || apiPassword ? '' : 'form-error'}`}
                        defaultValue={apiPassword}
                        onChange={async e => setApiPassword(e.target.value)}
                    />
                </div>
            </div>


            <div>
                <button
                    className="btn"
                    onClick={saveOptions}
                    disabled={apiBaseUrl ? !(apiBaseUrlValid && apiUsername && apiPassword) : false}
                >
                    Save
                </button>
            </div>
        </div >
    );
}