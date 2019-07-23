import React from 'react';
import MenuItem from './MenuItem';
import { toggleMark } from "prosemirror-commands";

import { EditorView } from 'prosemirror-view';
export default class RichTextMenu extends React.Component<{view: EditorView}, {activeMarks: string[]}> {

    constructor(props: any) {
        super(props);
        this.state = {
            activeMarks: []
        }
        this.toggleCommands = this.toggleCommands.bind(this);
        this.toggleState = this.toggleState.bind(this);
    }

    toggleCommands(e: React.SyntheticEvent) {
        e.preventDefault();
        this.props.view.focus();
        const view = this.props.view;
        const schema = this.props.view.state.schema;
        const command = (e.target as HTMLButtonElement).id;
        console.log("in it");
        console.log(command);
        console.log(e.target);
        switch (command) {
            case "bold":
                console.log(schema.marks.strong);
                toggleMark(schema.marks.strong)(view.state, view.dispatch);
                break;
            case "italic":
                console.log(schema.marks.em);
                toggleMark(schema.marks.em)(view.state, view.dispatch);
                break;
            default: 
                break;
        };
        this.toggleState(command);
        
    }

    toggleState(command: string) {
        const newState = [...this.state.activeMarks];
        if (this.state.activeMarks.includes(command)) {
            newState.splice(newState.indexOf(command), 1);
        }
        else {
            newState.push(command);
        }
        this.setState({activeMarks: newState});
    }

    render() {
        
        const formats = ["bold", "italic"];

        return (
            <div className="menu">
                    {formats.map(item => {
                        return <MenuItem 
                                format={item} 
                                handleClick={this.toggleCommands} 
                                active={this.state.activeMarks.includes(item)} 
                                key={item} />
                    })}
            </div>
        );
    }
}