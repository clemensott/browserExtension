import React, { useRef, useEffect } from 'react';
import VideoStateButton from './VideoStateButton';
import VideoStateDropdownVideoActionButtons from './VideoStateDropdownVideoActionButtons';
import './VideoStateDropdown.css';


export default function VideoStateDropdown({ videoId, apiUrl, actionButtons, open, onOpenChange }) {
    const dropdown = useRef(null);
    const closeMenu = useRef(e => {
        if (dropdown.current && !dropdown.current.contains(e.target)) {
            onOpenChange(false);
        }
    });

    const toggleMenu = e => {
        e.preventDefault();
        onOpenChange(!open);
    }

    useEffect(() => {
        if (open) {
            document.addEventListener('click', closeMenu.current);
        } else {
            document.removeEventListener('click', closeMenu.current);
        }
        return () => {
            document.removeEventListener('click', closeMenu.current);
        }
    }, [open]);

    return (
        <>
            <VideoStateButton text="" className="video-state-dropdown-action-button" onClick={toggleMenu} />
            {
                open ? (
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
