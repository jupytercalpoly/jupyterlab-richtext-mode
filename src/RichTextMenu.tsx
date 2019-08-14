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
import {  wrapIn, setBlockType, lift } from 'prosemirror-commands';
import { HoverBox, 
    // ReactWidget 
} from "@jupyterlab/apputils";
import { LinkMenu } from "./linkmenu";
import { ImageMenu } from "./imagemenu";
import { HeadingMenu } from "./headingmenu";
import { CodeMenu } from "./codemenu";
import { Widget } from '@phosphor/widgets';
import ReactDOM from "react-dom";
import { schema } from "./prosemirror/prosemirror-schema";
import { wrapInList } from "prosemirror-schema-list";
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
    model: CodeEditor.IModel, linkMenuWidget: Widget, imageMenuWidget: Widget, headingMenuWidget: Widget, codeMenuWidget: Widget}, 
    {activeMarks: string[], inactiveMarks: string[], widgetsSet: Widget[], widgetAttached: Widget}> {

        // Render menus into their specific widget nodes in menuWidgets
    constructor(props: any) {
        console.log("Rich text menu created!");
        super(props);
        this.state = {
            activeMarks: [],
            inactiveMarks: [],
            widgetAttached: null,
            widgetsSet: [] // After the MenuItem component mounts and I try to get the bounding DOMRect, it gives the wrong information, so these are flags to see
                            // if the menu widgets were set. 
        }
        if (this.props.view) {
            this.handleClick = this.handleClick.bind(this);
            this.toggleCommand = this.toggleCommand.bind(this);
            this.toggleState = this.toggleState.bind(this);
            this.formatMenu = this.formatMenu.bind(this);
            this.handleSubmitLink = this.handleSubmitLink.bind(this);
            this.handleImgUpload = this.handleImgUpload.bind(this);
            this.handleCancel = this.handleCancel.bind(this);
            this.handleSubmitImgLink = this.handleSubmitImgLink.bind(this);
            this.handleDeleteLink = this.handleDeleteLink.bind(this);
            this.handleHeadingClick = this.handleHeadingClick.bind(this);
            this.handleBlockCode = this.handleBlockCode.bind(this);
            this.handleInlineCode = this.handleInlineCode.bind(this);
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
                        if (that.state.widgetAttached && that.state.widgetAttached.isAttached) {
                            Widget.detach(that.state.widgetAttached);
                            that.setState({widgetAttached: null});
                        }
                    }
                    console.log(transaction.selection.$from.blockRange().parent);

                    // // console.log(source);
                    // // let { $from } = transaction.selection;
                    // // console.log($from.node());
                    // // if ($from.node().child($from.index(1)).type.name === "image") {
                    // //     console.log("issa image");
                    // //     transaction = transaction.setSelection(new TextSelection(doc.resolve($from.pos + 1)));
                    // // }
    
                    that.props.model.value.text = source;
    
                    // if (!transaction.storedMarksSet) {
                    //     let parent = transaction.selection.$from.parent;
                    //     let parentOffset = transaction.selection.$from.parentOffset;
                    //     let marks = scripts.getMarksForSelection(transaction, newState);
                    //     that.setState({activeMarks: marks.map(mark => {
                    //             if (mark.type.name === "link") {
                    //                 return "";
                    //             }
                    //             else {
                    //                 return mark.type.name;
                    //             }
                    //     })});
                        
                    //     if (parent.type.name === "paragraph" && parentOffset === 0) {// This is to handle formatting continuity.
                    //         transaction = transaction.setStoredMarks(marks); /** Important that setStoredMarks is used as opposed 
                    //         to manually toggling marks as that will infinitely
                    //         create transactions and inevitably error.
                    //         */ 
                    //     }
    
                    // }
                    
                    // newState = that.props.view.state.apply(transaction);
                    // console.log(newState.doc);
                    that.props.view.updateState(newState);
                }
            })
        }
        
    }

    componentDidMount() {

        if (!this.props.view) {
            this.setState({inactiveMarks: ["strong", "em", "underline", "strikethrough", "heading", "bullet_list", "ordered_list", "blockquote", "code", "link", "image"]});
        }
    }
    componentWillUnmount() {
        if (this.props.view) {
            this.props.linkMenuWidget.dispose();
            this.props.imageMenuWidget.dispose();
            this.props.headingMenuWidget.dispose();
            this.props.codeMenuWidget.dispose();
        }

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
            
            // let { from, to } = newSelection;
            let tr = view.state.tr;
            tr = tr.insertText(text);
            tr.setSelection(TextSelection.create(tr.doc, $from.pos, $from.pos + text.length));
            tr.addMark(tr.selection.from, tr.selection.to, schema.marks.link.create({href: link, title: link}));
            view.dispatch(tr);
                    // view.dispatch(view.state.tr.setSelection(newSelection));
            // view.dispatch(view.state.tr.addMark(from, to, schema.marks.link.create({href: link, title: link})));
            console.log(view.state.selection);
        }
        else {
            view.dispatch(view.state.tr.addMark(from, to, schema.marks.link.create({href: link, title: link})));
            
        }
        // scripts.toggleMark(schema.marks.link, {href: link})(view.state, view.dispatch);

        Widget.detach(this.props.linkMenuWidget);
        this.setState({widgetAttached: null});
    }

    handleDeleteLink(e: React.SyntheticEvent, link: string) {
        let view = this.props.view;
        let schema = view.state.schema;
        let { from, to } = view.state.selection;
        e.preventDefault();

        view.dispatch(view.state.tr.removeMark(from, to, schema.marks.link.create({href: link, title: link})));
        view.focus();
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

    handleInlineCode(e: React.SyntheticEvent) {
        e.preventDefault();
        let view = this.props.view;
        let schema = view.state.schema;
        view.focus();
        scripts.toggleMark(schema.marks.code)(view.state, view.dispatch);
        Widget.detach(this.props.codeMenuWidget);
        this.setState({widgetAttached: null});
    }

    handleBlockCode(e: React.SyntheticEvent, language: string) {
        e.preventDefault();
        let view = this.props.view;
        let schema = view.state.schema;
        view.focus();
        setBlockType(schema.nodes.code_block, {params: language})(view.state, view.dispatch);
        Widget.detach(this.props.codeMenuWidget);
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
        let selection = view.state.selection;
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
                this.formatMenu(e);
                break;
            case "strikethrough":
                scripts.toggleMark(schema.marks.strikethrough)(view.state, view.dispatch);
                break;
            case "blockquote":
                if (selection.$from.node(1).type.name === "blockquote") {
                    lift(view.state, view.dispatch);
                }
                else {
                    wrapIn(schema.nodes.blockquote)(view.state, view.dispatch);
                }
                break;
            case "link":
                this.formatMenu(e);
                break;
            case "image":
                this.formatMenu(e);
                break;
            case "heading":
                this.formatMenu(e);
                break;
            case "bullet_list":
                wrapInList(schema.nodes.bullet_list)(view.state, view.dispatch);
                break;
            case "ordered_list":
                wrapInList(schema.nodes.ordered_list)(view.state, view.dispatch);
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
        Widget.detach(this.state.widgetAttached);
        // Widget.detach(this.props.linkMenuWidget);
        // if (this.state.widgetAttached === this.props.linkMenuWidget) {
        //     this.setState({widgetAttached: null});
        // }
        this.setState({widgetAttached: null});
        this.props.view.focus();
    }

    handleHeadingClick(e: React.SyntheticEvent) {
        let target = (e.target as HTMLParagraphElement);
        let view = this.props.view;
        view.focus();
        switch (target.id) {
            case "heading0": // Normal
                setBlockType(schema.nodes.paragraph)(view.state, view.dispatch);
                break;
            case "heading1": // Title
                setBlockType(schema.nodes.heading, {level: 1})(view.state, view.dispatch);
                break;
            case "heading2": // Subtitle
                setBlockType(schema.nodes.heading, {level: 2})(view.state, view.dispatch);
                break;
            case "heading3": // Heading 1
                setBlockType(schema.nodes.heading, {level: 3})(view.state, view.dispatch);
                break;
            case "heading4": // Heading 2
                setBlockType(schema.nodes.heading, {level: 4})(view.state, view.dispatch);
                break;
            case "heading5": // Heading 3
                setBlockType(schema.nodes.heading, {level: 5})(view.state, view.dispatch);
                break;
            case "heading6": // Caption
                setBlockType(schema.nodes.heading, {level: 6})(view.state, view.dispatch);
                break;
            default:
                break;
        }
    }
    /**
     * Set geometry of the link widget.
     */
    formatMenu(e: React.SyntheticEvent) {
        let widget: Widget;
        let target = (e.target as HTMLElement);
        switch (target.id) {
            case "link":
                console.log("link widget");
                let { text, link } = scripts.getTextForSelection(this.props.view.state.selection, 
                    this.props.view);
                ReactDOM.render(<LinkMenu 
                                initialText={text} 
                                initialLink={link} 
                                submitLink={this.handleSubmitLink} 
                                key={this.props.view.state.selection.from} 
                                cancel={this.handleCancel} 
                                deleteLink={this.handleDeleteLink} />, this.props.linkMenuWidget.node);
                widget = this.props.linkMenuWidget;
                break;
            case "heading":
                console.log("heading widget");
                ReactDOM.render(<HeadingMenu 
                                handleClick={this.handleHeadingClick} />, this.props.headingMenuWidget.node);
                widget = this.props.headingMenuWidget;
                break;
            case "code":
                console.log("code widget");
                ReactDOM.render(<CodeMenu 
                                handleInlineCode={this.handleInlineCode} 
                                handleBlockCode={this.handleBlockCode} 
                                cancel={this.handleCancel}/>, this.props.codeMenuWidget.node);
                widget = this.props.codeMenuWidget;
                break;
            default:
                console.log("image widget");
                ReactDOM.render(<ImageMenu 
                                handleImgUpload={this.handleImgUpload} 
                                handleSubmitImgLink={this.handleSubmitImgLink} 
                                key={this.props.view.state.selection.from}
                                cancel={this.handleCancel} />, this.props.imageMenuWidget.node);
                widget = this.props.imageMenuWidget;
                break;
        }

        const style = window.getComputedStyle(widget.node);
        let rect = target.getBoundingClientRect();
        // console.log(target);
        // console.log(rect);

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
            if (this.state.widgetAttached && this.state.widgetAttached.isAttached) {
                console.log(this.state.widgetAttached);
                console.log(this.state.widgetAttached.isAttached);
                Widget.detach(this.state.widgetAttached);
            }
            this.setState({ widgetAttached: widget });

            Widget.attach(widget, document.body);
            // console.log(widget.isAttached);
        }
        else {
            Widget.detach(widget);
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
        
        const formats = ["format_bold", "format_italic", "format_underline", "format_strikethrough", 
        "text_fields", "format_list_bulleted", "format_list_numbered", "format_quote", "code",  "insert_link", "photo", ];
        const marks = ["strong", "em", "underline", "strikethrough", "heading", "bullet_list", "ordered_list", "blockquote", "code", "link", "image"];
        const separators = ["strong", "bullet_list", "link"]
        return (
            <div className="menu">
                    {formats.map((item, idx) => {
                            return <MenuItem 
                            format={item} 
                            handleClick={this.handleClick} 
                            active={this.state.activeMarks.includes(marks[idx])} 
                            cancelled={this.state.inactiveMarks.includes(marks[idx])}
                            separates={separators.includes(marks[idx])}
                            key={item} />
                    })}
            </div>
        );
    }
}
