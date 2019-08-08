import React from 'react';
import MenuItem from './MenuItem';
// import { toggleMark, 
//     // baseKeymap 
// } from "prosemirror-commands";

import { EditorView } from 'prosemirror-view';
// import { Mark } from 'prosemirror-model';
import * as scripts from './prosemirror/prosemirror-scripts';
import { Transaction, 
    // EditorState 
} from "prosemirror-state";
import { CodeEditor } from '@jupyterlab/codeeditor';
import * as Markdown from "./prosemirror/markdown";
import {  wrapIn } from 'prosemirror-commands';
import { HoverBox, ReactWidget } from "@jupyterlab/apputils";
import { LinkMenu } from "./linkmenu";
import { Widget } from '@phosphor/widgets';

// import { Menu } from '@phosphor/widgets';
// import { Schema } from 'prosemirror-model';
// import { keymap } from 'prosemirror-keymap';
// import { runInThisContext } from 'vm';

/**
 * A React component for the menu for the rich text editor.
 * 
 * @props view - The EditorView for the editor, used for catching transactions.
 * @state activeMarks - 
 */
export default class RichTextMenu extends React.Component<{view: EditorView, 
    model: CodeEditor.IModel}, {activeMarks: string[], linkWidget: Widget}> {

    constructor(props: any) {
        console.log("Rich text menu created!");
        super(props);
        this.state = {
            activeMarks: [],
            linkWidget: ReactWidget.create(<LinkMenu />)

        }
        this.handleClick = this.handleClick.bind(this);
        this.toggleCommand = this.toggleCommand.bind(this);
        this.toggleState = this.toggleState.bind(this);
        this.setGeometry = this.setGeometry.bind(this);
        let that = this;
        let state = this.props.view.state;
        console.log(state.doc);
        // console.log(state.selection);
        this.props.view.setProps({
            state,
            /**
             * Handles a transaction before it is applied to the editor state.
             * 
             * Obtains the marks for the current selection and makes those
             * the current 'storedMarks' (i.e. active marks for the next input.)
             * Finally, updates the editor state and view to reflect the transaction.
             * 
             * @param transaction - The state transaction generated upon interaction w/ editor.
             */
            dispatchTransaction(transaction: Transaction) {
                
                let newState = that.props.view.state.apply(transaction);
                let serializer = Markdown.serializer;
                let source = serializer.serialize(transaction.doc);
                
                
                // console.log(source);

                that.props.model.value.text = source;
                if (!transaction.storedMarksSet) {
                    let parent = transaction.selection.$from.parent;
                    let parentOffset = transaction.selection.$from.parentOffset;
                    let marks = scripts.getMarksForSelection(transaction, newState);
                    that.setState({activeMarks: marks.map(mark => mark.type.name)});
                    
                    if (parent.type.name === "paragraph" && parentOffset === 0) {// This is to handle formatting continuity.
                        transaction = transaction.setStoredMarks(marks); /** Important that setStoredMarks is used as opposed 
                        to manually toggling marks as that will infinitely
                        create transactions and inevitably error.
                        */ 
                    }

                }
                newState = that.props.view.state.apply(transaction);
                console.log(newState.doc);
                that.props.view.updateState(newState);
            }
        })
    }

    /**
     * Handles the on-click events for the rich text menu.
     * 
     * Toggle marks based on the button pressed. Also toggles the 
     * state's 'activeMarks' to determine highlighted/active buttons. 
     * 
     * @param e - The button on-click event. 
     */
    handleClick(e: React.SyntheticEvent) {
        e.preventDefault();
        this.props.view.focus();
        const command = (e.target as HTMLImageElement).id;
        // console.log("in it");
        // console.log(command);
        // console.log(e.target);
        this.toggleCommand(command, e);
        this.toggleState(command);
        
    }

    /**
     * Toggles the mark that is selected via button click or keybinding.
     * 
     * @param command - The name of the mark to be toggled.
     * @param e - The click event that was handled. This is necessary for anchor for link.
     */
    toggleCommand(command: string, e: React.SyntheticEvent) {
        const view = this.props.view;
        const schema = view.state.schema;
        switch (command) {
            case "strong":
                scripts.toggleMark(schema.marks.strong)(view.state, view.dispatch);
                break;
            case "em":
                scripts.toggleMark(schema.marks.em)(view.state, view.dispatch);
                break;
            case "underline":
                scripts.toggleMark(schema.marks.underline)(view.state, view.dispatch);
                break;
            case "code":
                scripts.toggleMark(schema.marks.code)(view.state, view.dispatch);
                break;
            case "strikethrough":
                scripts.toggleMark(schema.marks.strikethrough)(view.state, view.dispatch);
                break;
            case "blockquote":
                wrapIn(schema.nodes.blockquote)(view.state, view.dispatch);
                break;
            case "link":
                this.setGeometry(e);
                break;
            default: 
                break;
        };
    }


    /**
     * Set geometry of the link widget.
     */
    setGeometry(e: React.SyntheticEvent) {
        let linkWidget = this.state.linkWidget;
        console.log("setting geometry");
        const style = window.getComputedStyle(linkWidget.node);
        let target = (e.target as HTMLImageElement);
        let rect = target.getBoundingClientRect();
        console.log(rect);
        console.log(target);
        HoverBox.setGeometry({
            anchor: rect,
            host: target,
            minHeight: 50,
            maxHeight: 200,
            node:  linkWidget.node,
            privilege: "below",
            style
        });

        if (linkWidget.isAttached) {
            Widget.detach(linkWidget);
        }
        else {
            Widget.attach(linkWidget, document.body);
        }

    }

    
    
    
    /**
     * Toggles the state's 'activeMarks' based on the mark that is selected 
     * via button click or keybinding.
     * 
     * @param command - The name of the mark to be toggled.
     */
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

    
    /**
     * Renders the rich text menu component.
     */
    render() {
        
        const formats = ["format_bold", "format_italic", "format_underline", "format_strikethrough", "code", "format_quote", "insert_link"];
        const marks = ["strong", "em", "underline", "strikethrough", "code", "blockquote", "link"];
        return (
            <div className="menu">
                    {formats.map((item, idx) => {

                            return <MenuItem 
                            format={item} 
                            handleClick={this.handleClick} 
                            active={this.state.activeMarks.includes(marks[idx])} 
                            key={item} />
                    })}
            </div>
        );
    }
}