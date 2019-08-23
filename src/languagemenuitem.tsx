import React from 'react';

export function CodeLanguageMenuItem(props: any) {
    return (
        <div className="jp-scribe-heading-menu">
            <p style={{padding: "5px 10px", borderBottom: "1px solid #E0E0E0"}} onClick={(e) => props.handleSelect(e, props.name)}>
                {props.name}
            </p>
        </div>
    )
}