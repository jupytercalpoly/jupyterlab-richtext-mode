import React from 'react';
import MenuItem from './MenuItem';
// import { toggleMark, 
//     // baseKeymap 
// } from "prosemirror-commands";

import { EditorView } from 'prosemirror-view';
// import { Mark } from 'prosemirror-model';
import * as scripts from './prosemirror/prosemirror-scripts';
import { Transaction, TextSelection
    // EditorState 
} from "prosemirror-state";
import { CodeEditor } from '@jupyterlab/codeeditor';
import * as Markdown from "./prosemirror/markdown";
import {  wrapIn } from 'prosemirror-commands';
import { HoverBox, 
    // ReactWidget 
} from "@jupyterlab/apputils";
import { LinkMenu } from "./linkmenu";
import { ImageMenu } from "./imagemenu";
import { Widget } from '@phosphor/widgets';
import ReactDOM from "react-dom";
import { schema } from "./prosemirror/prosemirror-schema";
// import { MenuWidgetObject } from './widget';
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
    model: CodeEditor.IModel, linkMenuWidget: Widget, imageMenuWidget: Widget}, {activeMarks: string[], widgetsSet: Widget[], widgetAttached: Widget}> {

        // Render menus into their specific widget nodes in menuWidgets
    constructor(props: any) {
        console.log("Rich text menu created!");
        super(props);
        this.state = {
            activeMarks: [],
            widgetAttached: null,
            widgetsSet: [] // After the MenuItem component mounts and I try to get the bounding DOMRect, it gives the wrong information, so these are flags to see
                            // if the menu widgets were set. 
        }
        
        this.handleClick = this.handleClick.bind(this);
        this.toggleCommand = this.toggleCommand.bind(this);
        this.toggleState = this.toggleState.bind(this);
        this.setGeometry = this.setGeometry.bind(this);
        this.handleSubmitLink = this.handleSubmitLink.bind(this);
        this.handleImgUpload = this.handleImgUpload.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleSubmitImgLink = this.handleSubmitImgLink.bind(this);
        let that = this;
        let state = this.props.view.state;
        // console.log(state.doc);
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
                // let doc = this.state.doc;
                if (transaction.selectionSet) {
                    if (that.state.widgetAttached) {
                        Widget.detach(that.state.widgetAttached);
                        that.setState({widgetAttached: null});
                    }
                }
                
                // console.log(source);
                // let { $from } = transaction.selection;
                // console.log($from.node());
                // if ($from.node().child($from.index(1)).type.name === "image") {
                //     console.log("issa image");
                //     transaction = transaction.setSelection(new TextSelection(doc.resolve($from.pos + 1)));
                // }

                that.props.model.value.text = source;

                if (!transaction.storedMarksSet) {
                    let parent = transaction.selection.$from.parent;
                    let parentOffset = transaction.selection.$from.parentOffset;
                    let marks = scripts.getMarksForSelection(transaction, newState);
                    that.setState({activeMarks: marks.map(mark => {
                            if (mark.type.name === "link") {
                                return "";
                            }
                            else {
                                return mark.type.name;
                            }
                    })});
                    
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

    componentWillUnmount() {
        this.props.linkMenuWidget.dispose();
        this.props.imageMenuWidget.dispose();
    }

    handleImgUpload(fileUrl: unknown, e: React.SyntheticEvent) {
        e.preventDefault();
        let view = this.props.view;
        console.log(fileUrl);
        view.focus();
        view.dispatch(view.state.tr.replaceWith(view.state.selection.from, view.state.selection.to, schema.nodes.image.create({src: fileUrl})));
    }

    handleSubmitLink(initialText: string, initialLink: string, text: string, link: string) {
        let view = this.props.view;
        let schema = view.state.schema;
        let { $from, from, to } = view.state.selection;
        view.focus();
        console.log(view.state.selection);
        if (initialText !== text) {
            
            let $to = view.state.doc.resolve($from.pos + text.length);
            let newSelection = new TextSelection($from, $to);
            let { from, to } = newSelection;
            view.dispatch(view.state.tr.insertText(text).setSelection(newSelection));
            view.dispatch(view.state.tr.addMark(from, to, schema.marks.link.create({href: link, title: link})));
            console.log(view.state.selection);
        }
        else {
            view.dispatch(view.state.tr.addMark(from, to, schema.marks.link.create({href: link, title: link})));
            
        }
        // scripts.toggleMark(schema.marks.link, {href: link})(view.state, view.dispatch);

        Widget.detach(this.props.linkMenuWidget);
        this.setState({widgetAttached: null});
    }

    handleSubmitImgLink(url: string) {

        let view = this.props.view;

        view.focus();
        let schema = view.state.schema;
        let { from, to } = view.state.selection;
        view.dispatch(view.state.tr.replaceWith(from, to, schema.nodes.image.create({src: url})));
        Widget.detach(this.props.imageMenuWidget);
        this.setState({widgetAttached: null});
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
        console.log("in it");
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
        console.log(this.props.children);
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
            case "image":
                this.setGeometry(e);
                break;
            default: 
                break;
        };
    }


    /**
     * Event handler for clicking on the 'Cancel' button on the link menu.
     * @param e 
     */
    handleCancel(e: React.SyntheticEvent) {
        Widget.detach(this.props.linkMenuWidget);
        if (this.state.widgetAttached === this.props.linkMenuWidget) {
            this.setState({widgetAttached: null});
        }
        this.props.view.focus();
    }

    /**
     * Set geometry of the link widget.
     */
    setGeometry(e: React.SyntheticEvent) {
        let widget: Widget;
        let target = (e.target as HTMLElement);
        switch (target.id) {
            case "link":
                console.log("link widget");
                let { text, link } = scripts.getTextForSelection(this.props.view.state.selection, 
                    this.props.view);
                ReactDOM.render(<LinkMenu initialText={text} initialLink={link} submitLink={this.handleSubmitLink} key={text} cancel={this.handleCancel} />, this.props.linkMenuWidget.node);
                widget = this.props.linkMenuWidget;
                break;
            default:
                console.log("image widget");
                ReactDOM.render(<ImageMenu handleImgUpload={this.handleImgUpload} handleSubmitImgLink={this.handleSubmitImgLink} key={this.props.view.state.selection.from}/>, this.props.imageMenuWidget.node);
                widget = this.props.imageMenuWidget;
                break;
        }

        const style = window.getComputedStyle(widget.node);
        let rect = target.getBoundingClientRect();
        console.log(target);
        console.log(rect);

        if (!this.state.widgetsSet.includes(widget)) {
            let widgets = [...this.state.widgetsSet];
            widgets.push(widget);
            this.setState({widgetsSet: widgets});
            console.log("Setting widget!");
            HoverBox.setGeometry({
                anchor: rect,
                host: target,
                minHeight: 50,
                maxHeight: 500,
                node:  widget.node,
                privilege: "below",
                style
            });
        }

        if (!widget.isAttached) {
            if (this.state.widgetAttached) {
                Widget.detach(this.state.widgetAttached);
            }
            this.setState({ widgetAttached: widget });

            Widget.attach(widget, document.body);
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
        
        const formats = ["format_bold", "format_italic", "format_underline", "format_strikethrough", "code", "format_quote", "insert_link", "photo"];
        const marks = ["strong", "em", "underline", "strikethrough", "code", "blockquote", "link", "image"];
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