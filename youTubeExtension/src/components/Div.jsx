import React from 'react';

export default function ({ children, ...props } = {}) {
    return (
        <div {...props}>{children}</div>
    );
}