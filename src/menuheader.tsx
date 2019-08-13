import React from 'react';

export default function MenuHeader(props: any) {
    if (props.canClick) {
        return (
            <div onClick={props.handleClick}>
                <p 
                className="editor-menuLabel backToMenu" 
                style={{padding: "12px 0px 5px 12px", borderBottom: "1px solid #E0E0E0"}}
                >{props.name}</p>
                
                
            </div>
            );
    }
    else {
        return (
            <div>
                <p 
                className="editor-menuLabel" 
                style={{padding: "12px 0px 5px 12px", borderBottom: "1px solid #E0E0E0"}}
                >{props.name}</p>
                
            </div>
        );
    }

}