import React, { useState, useRef, useEffect } from 'react';
import VideoStateButton from './VideoStateButton';
import VideoStateDropdownVideoActionButtons from './VideoStateDropdownVideoActionButtons';
import './VideoStateDropdown.css';


export default function VideoStateDropdown({ videoId, apiUrl, actionButtons, defaultOpen, onDropdownOpenChange }) {
    const [showMenu, setShowMenu] = useState(defaultOpen);
    const dropdown = useRef(null);
    const closeMenu = useRef(e => {
        if (dropdown.current && !dropdown.current.contains(e.target)) {
            setShowMenu(false);
        }
    });

    const toggleMenu = e => {
        e.preventDefault();
        setShowMenu(!showMenu);
    }

    useEffect(() => {
        if (showMenu) {
            document.addEventListener('click', closeMenu.current);
        } else {
            document.removeEventListener('click', closeMenu.current);
        }
        if (typeof onDropdownOpenChange === 'function') {
            onDropdownOpenChange(showMenu);
        }
        return () => {
            document.removeEventListener('click', closeMenu.current);
        }
    }, [showMenu]);

    return (
        <>
            <VideoStateButton text="" className="video-state-dropdown-action-button" onClick={toggleMenu} />
            {
                showMenu ? (
                    <div className="video-state-dropdown-container">
                        <div ref={dropdown} className="video-state-dropdown-menu-container">
                            <div className="video-state-dropdown-menu-item">
                                <a className="video-state-dropdown-menu-thumbnail"
                                    href={`${apiUrl}/pages/thumbnail?videoId=${encodeURIComponent(videoId)}`}>
                                    Thumbnail
                                </a>
                            </div>
                            <VideoStateDropdownVideoActionButtons buttons={actionButtons} />
                        </div>
                    </div>
                ) : null
            }
        </>
    );
}
