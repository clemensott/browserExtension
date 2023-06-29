import React from 'react';

export default function RootElement(Component, props = {}) {
    return (<>
        <Component {...props} />
    </>)
}