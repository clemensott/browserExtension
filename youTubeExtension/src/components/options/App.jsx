import React, { useRef, useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import StorageService from '../../Services/StorageService';
import OptionsService from '../../Services/OptionsService';
import API from '../../Services/API';
import clsx from 'clsx';
import { Checkbox } from './Checkbox';
import './App.css';

const storageService = new StorageService(browser);
const options = new OptionsService(storageService);

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
    const [isDomManipulationEnabled, setIsDomManipulationEnabled] = useState(false);
    const [subscriptionBoxReloadSeconds, setSubscriptionBoxReloadSeconds] = useState('');
    const [isVideoPlayerManipulationEnabled, setIsVideoPlayerManipulationEnabled] = useState(true);
    const [isFastForwardVideoButtonEnabled, setIsEndVideoButtonEnabled] = useState(false);
    const [isSaveTimestampEnabled, setIsSaveTimestampEnabled] = useState(false);
    const [isPauseChannelTrailerEnabled, setIsPauseChannelTrailerEnabled] = useState(false);
    const [hideDislikeVideoButton, setHideDislikeVideoButton] = useState(false);
    const [hideDownloadVideoButton, setHideDownloadVideoButton] = useState(false);
    const [hideClipVideoButton, setHideClipVideoButton] = useState(false);
    const [hideThankVideoButton, setHideThankVideoButton] = useState(false);
    const [hideSaveVideoButton, setHideSaveVideoButton] = useState(false);
    const [hideRecommendationPromps, setHideRecommendationPromps] = useState(false);
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [apiBaseUrlValid, setApiBaseUrlValid] = useState(true);
    const [apiUsername, setApiUsername] = useState('');
    const [apiPassword, setApiPassword] = useState('');
    const pingApiId = useRef(0);

    const checkBaseUrlValid = async url => {
        const pingId = ++pingApiId.current;
        const baseUrlValid = await pingApi(url);

        if (pingId === pingApiId.current) {
            setApiBaseUrlValid(baseUrlValid);
        }
    }

    useEffect(() => {
        (async () => {
            await options.load();

            setIsDomManipulationEnabled(!!options.isDomManipulationEnabled);
            setSubscriptionBoxReloadSeconds(String(options.subscriptionBoxReloadSeconds));

            setIsVideoPlayerManipulationEnabled(!!options.isVideoPlayerManipulationEnabled);
            setIsEndVideoButtonEnabled(!!options.isFastForwardVideoButtonEnabled);
            setIsSaveTimestampEnabled(!!options.isSaveTimestampEnabled);
            setIsPauseChannelTrailerEnabled(!!options.isPauseChannelTrailerEnabled);

            setHideDislikeVideoButton(!!options.hideDislikeVideoButton);
            setHideDownloadVideoButton(!!options.hideDownloadVideoButton);
            setHideClipVideoButton(!!options.hideClipVideoButton);
            setHideThankVideoButton(!!options.hideThankVideoButton);
            setHideSaveVideoButton(!!options.hideSaveVideoButton);
            setHideRecommendationPromps(!!options.hideRecommendationPromps);

            setApiBaseUrl(options.apiBaseUrl);
            setApiUsername(options.apiUsername);
            setApiPassword(options.apiPassword);

            checkBaseUrlValid(options.apiBaseUrl);
        })();
    }, [options]);

    useEffect(() => {
        checkBaseUrlValid(apiBaseUrl);
    }, [apiBaseUrl]);

    const saveOptions = () => {
        options.isDomManipulationEnabled = !!isDomManipulationEnabled;
        options.subscriptionBoxReloadSeconds = Number.parseInt(subscriptionBoxReloadSeconds, 10);

        options.isVideoPlayerManipulationEnabled = !!isVideoPlayerManipulationEnabled;
        options.isFastForwardVideoButtonEnabled = !!isFastForwardVideoButtonEnabled;
        options.isSaveTimestampEnabled = !!isSaveTimestampEnabled;
        options.isPauseChannelTrailerEnabled = !!isPauseChannelTrailerEnabled;

        options.hideDislikeVideoButton = !!hideDislikeVideoButton;
        options.hideDownloadVideoButton = !!hideDownloadVideoButton;
        options.hideClipVideoButton = !!hideClipVideoButton;
        options.hideThankVideoButton = !!hideThankVideoButton;
        options.hideSaveVideoButton = !!hideSaveVideoButton;
        options.hideRecommendationPromps = !!hideRecommendationPromps;

        options.apiBaseUrl = apiBaseUrl;
        options.apiUsername = apiUsername;
        options.apiPassword = apiPassword;

        alert('Options saved!');
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <h1>YouTube Extension Options</h1>
            </div>

            <div className="form-section">
                <h2>Video Player Manipulation</h2>

                <div className="info-text">
                    Fast forwards, mutes and turn ads black.
                </div>

                <Checkbox
                    checked={isVideoPlayerManipulationEnabled}
                    label="Enable video player manipulation"
                    onChange={e => setIsVideoPlayerManipulationEnabled(e.target.checked)}
                />

                <Checkbox
                    checked={isFastForwardVideoButtonEnabled}
                    disabled={!isVideoPlayerManipulationEnabled}
                    label="Enable fast forward video button"
                    onChange={e => setIsEndVideoButtonEnabled(e.target.checked)}
                />

                <Checkbox
                    checked={isSaveTimestampEnabled}
                    disabled={!isVideoPlayerManipulationEnabled}
                    label="Automaticly adding timestamp of current video to URL"
                    onChange={e => setIsSaveTimestampEnabled(e.target.checked)}
                />

                <Checkbox
                    checked={isPauseChannelTrailerEnabled}
                    label="Enable pausing channel trailer"
                    onChange={e => setIsPauseChannelTrailerEnabled(e.target.checked)}
                />
            </div>

            <div className="form-section">
                <h2>User Interface Manipulation</h2>

                <div className="info-text">
                    Adds various additional elements to user interface.
                </div>

                <Checkbox
                    checked={isDomManipulationEnabled}
                    label="Enable various user interface manipulations"
                    onChange={e => setIsDomManipulationEnabled(e.target.checked)}
                />

                <div className="form-group">
                    <label htmlFor="subscriptionbox-reload-time">Subscription box reload countdown in seconds</label>
                    <input
                        id="subscriptionbox-reload-time"
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        value={subscriptionBoxReloadSeconds}
                        disabled={!isDomManipulationEnabled}
                        onChange={e => setSubscriptionBoxReloadSeconds(e.target.value)}
                    />
                </div>
            </div>

            <div className="form-section">
                <h2>Hide Elements</h2>

                <div className="info-text">
                    Hide certain GUI elements on site.
                </div>

                <Checkbox
                    checked={hideDislikeVideoButton}
                    label="Dislike video Button"
                    onChange={e => setHideDislikeVideoButton(e.target.checked)}
                />

                <Checkbox
                    checked={hideDownloadVideoButton}
                    label="Download video button"
                    onChange={e => setHideDownloadVideoButton(e.target.checked)}
                />

                <Checkbox
                    checked={hideClipVideoButton}
                    label="Clip video button"
                    onChange={e => setHideClipVideoButton(e.target.checked)}
                />

                <Checkbox
                    checked={hideThankVideoButton}
                    label="Thank video button"
                    onChange={e => setHideThankVideoButton(e.target.checked)}
                />

                <Checkbox
                    checked={hideSaveVideoButton}
                    label="Save video button"
                    onChange={e => setHideSaveVideoButton(e.target.checked)}
                />

                <Checkbox
                    checked={hideRecommendationPromps}
                    label="Recommendation promps"
                    onChange={e => setHideRecommendationPromps(e.target.checked)}
                />
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
                        className={clsx('form-control', apiBaseUrl && !apiBaseUrlValid && 'form-error')}
                        value={apiBaseUrl}
                        onChange={e => setApiBaseUrl(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="api-username">Username</label>
                    <input
                        id="api-username"
                        type="text"
                        className={clsx('form-control', apiBaseUrlValid && !apiUsername && 'form-error')}
                        value={apiUsername}
                        onChange={e => setApiUsername(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="api-password">Password</label>
                    <input
                        id="api-username"
                        type="password"
                        className={clsx('form-control', apiBaseUrlValid && !apiPassword && 'form-error')}
                        value={apiPassword}
                        onChange={e => setApiPassword(e.target.value)}
                    />
                </div>
            </div>


            <div>
                <button
                    className="btn"
                    onClick={saveOptions}
                    disabled={apiBaseUrl && !(apiBaseUrlValid && apiUsername && apiPassword)}
                >
                    Save
                </button>
            </div>
        </div >
    );
}
