import React, { useRef } from 'react';
import randomString from '../../utils/randomString';


export function Checkbox({ defaultChecked, checked, disabled, label, onChange }) {
    const { current: id } = useRef(`checkbox-id-${randomString()}`);
    return (
        <div className="form-group">
            <input
                id={id}
                type="checkbox"
                defaultChecked={defaultChecked}
                checked={checked}
                disabled={disabled}
                onChange={onChange}
            />
            <label htmlFor={id}>{label}</label>
        </div>
    );
}
