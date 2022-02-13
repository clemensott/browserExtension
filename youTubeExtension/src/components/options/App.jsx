import React, { useRef, useEffect, useState } from 'react';
import StorageService from '../../Services/StorageService';
import OptionsService from '../../Services/OptionsService';
import './App.css';

const options = new OptionsService(new StorageService());

export default function App() {
    const [loaded, setLoaded] = useState(false);
    const enableEndVideoButton = useRef();
    const apiBaseUrl = useRef();
    const apiUsername = useRef();
    const apiPassword = useRef();
    const enableSubscriptionboxReload = useRef();
    const subscriptionboxReloadSeconds = useRef();

    useEffect(() => {
        (async () => {
            await options.load();
            setLoaded(true);
        })();
    }, [options]);

    const saveOptions = () => {
        options.isEndVideoButtonEnabled = !!enableEndVideoButton.current.checked;

        options.apiBaseUrl = apiBaseUrl.current.value;
        options.apiUsername = apiUsername.current.value;
        options.apiPassword = apiPassword.current.value;

        options.isSubscriptionBoxReloadEnabled = !!enableSubscriptionboxReload.current.checked;
        options.subscriptionBoxReloadSeconds = parseInt(subscriptionboxReloadSeconds.current.value, 10);
    };

    return (
        <div className="container">
            <h1>YouTube Extension Options</h1>

            <div className="form-section">
                <h2>Video Player</h2>

                <div className="form-group">
                    <input
                        ref={enableEndVideoButton}
                        id="enable-end-video-button"
                        type="checkbox"
                        defaultChecked={options.isEndVideoButtonEnabled}
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
                        ref={apiBaseUrl}
                        id="api-base-url"
                        type="text"
                        className="form-control"
                        defaultValue={options.apiBaseUrl}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="api-username">Username</label>
                    <input
                        ref={apiUsername}
                        id="api-username"
                        type="text"
                        className="form-control"
                        defaultValue={options.apiUsername}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="api-password">Password</label>
                    <input
                        ref={apiPassword}
                        id="api-username"
                        type="text"
                        className="form-control"
                        defaultValue={options.apiPassword}
                    />
                </div>
            </div>

            <div className="form-section">
                <h2>Subscription Box</h2>

                <div className="form-group">
                    <input
                        ref={enableSubscriptionboxReload}
                        id="enable-subscriptionbox-reload"
                        type="checkbox"
                        defaultChecked={options.isSubscriptionBoxReloadEnabled}
                    />
                    <label htmlFor="enable-subscriptionbox-reload">Enable reload site</label>
                </div>

                <div className="form-group">
                    <label htmlFor="subscriptionbox-reload-time">Reload countdown in seconds</label>
                    <input
                        ref={subscriptionboxReloadSeconds}
                        id="subscriptionbox-reload-time"
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        defaultValue={options.subscriptionBoxReloadSeconds}
                    />
                </div>
            </div>


            <div>
                <button className="btn" onClick={saveOptions}>Save</button>
            </div>
        </div>
    );
}