import React from 'react';
import MenuItem from './menuitem';
import MenuHeader from './menuheader';

export function ListExperimentalMenu(props: any) {
    let tooltips = ["bullet list", "ordered list"];
    return (
        <div className="editor-menu">
            <MenuHeader 
            name="list"
            canClick={true}
            handleClick={props.returnToExperimental} />
            <div style={{padding: "10px 25px"}}>
                {props.formats.map((format: string, idx: any) => {
                    return <MenuItem 
                        format={format}
                        active={props.active[idx]}
                        cancelled={false}
                        tooltip={tooltips[idx]}
                        handleClick={props.handleClick}
                    />;
                })}
            </div>

        </div>
    );
}