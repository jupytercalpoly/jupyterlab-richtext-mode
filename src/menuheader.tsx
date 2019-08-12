import React from 'react';

export default function MenuHeader(props: any) {
    if (props.canClick) {
        return (
            <div onClick={props.handleClick}>
                <p className="editor-menuLabel backToMenu">{props.name}</p>
                <hr/>
            </div>
            );
    }
    else {
        return (
            <div>
                <p className="editor-menuLabel">{props.name}</p>
                <hr/>
            </div>
        );
    }

}