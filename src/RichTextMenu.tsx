import React from 'react';
import MenuItem from './menuitem';
// import { toggleMark, 
//     // baseKeymap 
// } from "prosemirror-commands";

import { EditorView } from 'prosemirror-view';
// import { Mark } from 'prosemirror-model';
import * as scripts from './prosemirror/prosemirror-scripts';
import { Transaction, TextSelection, Plugin
    // EditorState 
} from "prosemirror-state";
// import { CodeEditor } from '@jupyterlab/codeeditor';
import * as Markdown from "./prosemirror/markdown";
import {  setBlockType } from 'prosemirror-commands';
import { HoverBox, 
    // ReactWidget 
} from "@jupyterlab/apputils";
import { LinkMenu } from "./linkmenu";
import { ImageMenu } from "./imagemenu";
import { HeadingMenu } from "./headingmenu";
import { CodeMenu } from "./codemenu";
import { Widget } from '@lumino/widgets';
import ReactDOM from "react-dom";
import { schema } from "./prosemirror/prosemirror-schema";
import { ICellModel } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';

import ExperimentalMenu from './experimentalmenu';
import { ListExperimentalMenu } from './listexperimentalmenu';
import { MathExperimentalMenu } from './mathexperimentalmenu';
import { inputRules } from 'prosemirror-inputrules';
import { createInputRules, createMathInputRules } from './prosemirror/inputrules';
import { IStateDB } from '@jupyterlab/statedb';

/**
 * A React component for the menu for the rich text editor.
 * 
 * @props view - The EditorView for the editor, used for catching transactions.
 * @state activeMarks - 
 */

export default class RichTextMenu extends React.Component<{view: EditorView, 
    model: ICellModel, linkMenuWidget: Widget, imageMenuWidget: Widget, headingMenuWidget: Widget, codeMenuWidget: Widget,
    codeLanguageMenuWidget: Widget, experimentalMenuWidget: Widget, listExperimentalMenuWidget: Widget,
    mathExperimentalMenuWidget: Widget, state: IStateDB, commands: CommandRegistry}, 
    {activeMarks: string[], activeWrapNodes: string[], inactiveMarks: string[], mathEnabled: boolean, widgetsSet: Widget[], widgetAttached: Widget, experimentalFeatures: string[]}> {

        // Render menus into their specific widget nodes in menuWidgets

    constructor(props: any) {
        console.log("Rich text menu created!");
        super(props);
        this.state = {
            activeMarks: [],
            activeWrapNodes: [],
            inactiveMarks: [],
            experimentalFeatures: ["strikethrough",
                                    "list_experimental",
                                    "blockquote",
                                    "code",
                                    "link",
                                    "image",
                                    "math_experimental"],
            mathEnabled: true,
            widgetAttached: null,
            widgetsSet: [] // After the MenuItem component mounts and I try to get the bounding DOMRect, it gives the wrong information, so these are flags to see
                            // if the menu widgets were set. 

        }
        console.log(this.state.mathEnabled);
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
            this.addPluginForCommands = this.addPluginForCommands.bind(this);
            this.handleExperimentalClick = this.handleExperimentalClick.bind(this);
            this.handleReturnToExperimental = this.handleReturnToExperimental.bind(this);
            this.handleExperimentalMath = this.handleExperimentalMath.bind(this);
            this.setMathEnabled = this.setMathEnabled.bind(this);
            let that = this;
            let state = this.props.view.state;


            // let MathJax: any;
            // console.log(state.doc);
            // console.log(state.selection);
            let isMarkdown = this.props.model.metadata.get("markdownMode");
            if (isMarkdown !== undefined ? isMarkdown : false) {
                console.log("we have a markdown editor");
                this.props.view.setProps({
                    state, 
                    dispatchTransaction(transaction: Transaction) {
                        state = state.apply(transaction);
                        that.props.view.updateState(state);
                        that.props.model.value.text = state.doc.textContent;
                    }
                })
            }
            else {
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
                        // that.props.typesetter.typeset((that.props.view.dom as HTMLElement));                    
                        let newState = that.props.view.state.apply(transaction);
                        let serializer = Markdown.serializer;
                        let source = serializer.serialize(transaction.doc);
                        let activeWrapNodes = [];

                        if (transaction.selectionSet) {
                            if (that.state.widgetAttached && that.state.widgetAttached.isAttached) {
                                Widget.detach(that.state.widgetAttached);
                                that.setState({widgetAttached: null});
                            }
                        }
        
                        that.props.model.value.text = source;
    
                        activeWrapNodes = scripts.getWrappingNodes(transaction);
                        that.setState({activeWrapNodes});
    
                        let marks = scripts.getMarksForSelection(newState);
                            that.setState({activeMarks: marks.map(mark => {
                                    if (mark.type.name === "link") {
                                        return "";
                                    }
                                    else {
                                        return mark.type.name;
                                    }
                            })});                        
                        
                        newState = that.props.view.state.apply(transaction);
                        that.props.view.updateState(newState);
                    }
                })
            }
            
        }
        
    }

    
    componentDidMount() {
        if (!this.props.view || this.props.model.metadata.get("markdownMode") === true) {
            this.setState({inactiveMarks: ["strong", "em", "underline", "strikethrough", "heading", "bullet_list", "ordered_list", "blockquote", "code", "link", "image", "experimental"]});
        }
        if (this.props.view)
        {
            this.setMathEnabled();
        }
    }

    async setMathEnabled() {
        let enabled;
        await Promise.all([this.props.state.fetch("test-markdown:math-enabled")])
        .then(([saved])=>{
            console.log("checking math again!");
            console.log(saved);
            if (saved === undefined)
            {
                enabled = true;
            }
            else
            {
                enabled = saved === "y";
            }
        });

        this.setState({mathEnabled: enabled});

        let newPlugins = [...this.props.view.state.plugins].slice(0, 3);
        console.log(enabled);
        if (enabled)
        {
            newPlugins.push(inputRules({rules: createInputRules().concat(createMathInputRules())}));
        }
        else 
        {
            newPlugins.push(inputRules({rules: createInputRules()}));
        }
        this.props.view.updateState(this.props.view.state.reconfigure({plugins: newPlugins}));
    }
    componentWillUnmount() {
        if (this.props.view) {
            this.props.linkMenuWidget.dispose();
            this.props.imageMenuWidget.dispose();
            this.props.headingMenuWidget.dispose();
            this.props.codeMenuWidget.dispose();
            this.props.codeLanguageMenuWidget.dispose();
            this.props.experimentalMenuWidget.dispose();
            this.props.listExperimentalMenuWidget.dispose();
            this.props.mathExperimentalMenuWidget.dispose();
        }

    }

    addPluginForCommands() {
        let newPlugins = [...this.props.view.state.plugins];
        let that = this;
        newPlugins.push(new Plugin({
            state: {
                init() { return that.props.commands },
                apply(tr, value) { return value }
            },

        }))
        this.props.view.updateState(this.props.view.state.reconfigure({plugins: newPlugins}));

    }
    handleImgUpload(fileUrl: unknown, e: React.SyntheticEvent) {
        e.preventDefault();
        let view = this.props.view;
        view.focus();
        view.dispatch(view.state.tr.replaceWith(view.state.selection.from, view.state.selection.to, schema.nodes.image.create({src: fileUrl})));
    }

    handleSubmitLink(initialText: string, initialLink: string, text: string, link: string) {
        let view = this.props.view;
        let schema = view.state.schema;
        let { $from, from, to } = view.state.selection;
        view.focus();
        if (initialText !== text) {
            
            // let { from, to } = newSelection;
            let tr = view.state.tr;
            tr = tr.insertText(text);
            tr.setSelection(TextSelection.create(tr.doc, $from.pos, $from.pos + text.length));
            tr.addMark(tr.selection.from, tr.selection.to, schema.marks.link.create({href: link, title: link}));
            view.dispatch(tr);

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
        Widget.detach(this.props.codeLanguageMenuWidget);
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

        this.toggleCommand(command, e);
        this.toggleState(command);
        
    }

    handleExperimentalClick(e: React.SyntheticEvent) {
        e.preventDefault();
        this.props.view.focus();
        const command = (e.target as HTMLParagraphElement).id;
        switch (command)
        {
            case "math":
                break;
            default:
                this.toggleCommand(command, e);
                this.toggleState(command);
                break;
        }

    }

    handleReturnToExperimental(e: React.SyntheticEvent) {
        Widget.detach(this.state.widgetAttached);
        Widget.attach(this.props.experimentalMenuWidget, document.body);
        this.setState({widgetAttached: this.props.experimentalMenuWidget});
    }

    /**
     * Sets mathEnabled state. 
     * Uses reconfigure() to change state to toggle the math input rules. 
     */
    handleExperimentalMath(e: React.SyntheticEvent) {

        let newPlugins = [...this.props.view.state.plugins].slice(0, 3);
        if (this.state.mathEnabled)
        {
            newPlugins.push(inputRules({rules: createInputRules()}));
        }
        else 
        {
            newPlugins.push(inputRules({rules: createInputRules().concat(createMathInputRules())}));
        }
        console.log("setting math");
        console.log(!this.state.mathEnabled);
        Promise.all([this.props.state.save("test-markdown:math-enabled", !this.state.mathEnabled ? "y" : "n")])
        .then((saved) => {
            console.log(saved);
            Widget.detach(this.state.widgetAttached);
            this.setState({mathEnabled: !this.state.mathEnabled, widgetAttached: null});
            this.props.view.updateState(this.props.view.state.reconfigure({plugins: newPlugins}));

        });
        
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
                this.formatMenu(e);
                break;
            case "strikethrough":
                scripts.toggleMark(schema.marks.strikethrough)(view.state, view.dispatch);
                break;
            case "blockquote":
                scripts.toggleBlockquote(view.state, view.dispatch, view);
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
                scripts.toggleBulletList(view.state, view.dispatch, view);
                break;
            case "ordered_list":
                scripts.toggleOrderedList(view.state, view.dispatch, view);
                break;
            case "experimental":
                this.formatMenu(e);
                break;
            case "list_experimental":
                this.formatMenu(e);
                break;
            case "math_experimental":
                this.formatMenu(e);
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
        if (this.props.codeLanguageMenuWidget.isAttached) {
            Widget.detach(this.props.codeLanguageMenuWidget);
        }
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
        Widget.detach(this.props.headingMenuWidget);
        this.setState({widgetAttached: null});
    }
    /**
     * Set geometry of the link widget.
     */
    formatMenu(e: React.SyntheticEvent) {
        let widget: Widget;
        let target = (e.target as HTMLElement);

        switch (target.id) {
            case "link":
                let { text, link } = scripts.getTextForSelection(this.props.view.state.selection, 
                    this.props.view);
                ReactDOM.render(<LinkMenu 
                                initialText={text} 
                                initialLink={link} 
                                submitLink={this.handleSubmitLink} 
                                key={this.props.view.state.selection.from} 
                                cancel={this.handleCancel} 
                                deleteLink={this.handleDeleteLink}
                                returnToExperimental={this.handleReturnToExperimental} />, this.props.linkMenuWidget.node);
                widget = this.props.linkMenuWidget;
                break;
            case "heading":
                let activeLevel = scripts.getHeadingLevel(this.props.view.state.selection);
                ReactDOM.render(<HeadingMenu 
                                handleClick={this.handleHeadingClick} 
                                activeLevel={activeLevel} />, this.props.headingMenuWidget.node);
                widget = this.props.headingMenuWidget;
                break;
            case "code":
                ReactDOM.render(<CodeMenu 
                                handleInlineCode={this.handleInlineCode} 
                                handleBlockCode={this.handleBlockCode} 
                                cancel={this.handleCancel}
                                languageWidget={this.props.codeLanguageMenuWidget}
                                key={this.props.view.state.selection.from}
                                returnToExperimental={this.handleReturnToExperimental} />, this.props.codeMenuWidget.node);
                widget = this.props.codeMenuWidget;
                break;
            case "image":
                ReactDOM.render(<ImageMenu 
                                handleImgUpload={this.handleImgUpload} 
                                handleSubmitImgLink={this.handleSubmitImgLink} 
                                key={this.props.view.state.selection.from}
                                cancel={this.handleCancel}
                                returnToExperimental={this.handleReturnToExperimental} 
                                />, this.props.imageMenuWidget.node);
                widget = this.props.imageMenuWidget;
                break;
            case "experimental":
                ReactDOM.render(<ExperimentalMenu
                                handleClick={this.handleExperimentalClick} 
                                features={this.state.experimentalFeatures}
                                />, this.props.experimentalMenuWidget.node);
                widget = this.props.experimentalMenuWidget;
                break;
            case "list_experimental":
                let formats = ["bullet_list", "ordered_list"];
                ReactDOM.render(<ListExperimentalMenu
                                formats={formats}
                                active={formats.map((format) => this.state.activeWrapNodes.includes(format))}
                                handleClick={this.handleClick}
                                returnToExperimental={this.handleReturnToExperimental} />, this.props.listExperimentalMenuWidget.node);
                widget = this.props.listExperimentalMenuWidget;
                break;
            default:
                ReactDOM.render(<MathExperimentalMenu
                                enabled={this.state.mathEnabled}
                                handleClick={this.handleExperimentalMath}
                                returnToExperimental={this.handleReturnToExperimental}
                                />, this.props.mathExperimentalMenuWidget.node);
                widget = this.props.mathExperimentalMenuWidget;
                
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
            if (this.state.widgetAttached && 
                this.state.widgetAttached.id === "experimental" &&
                this.state.experimentalFeatures.includes(target.id))
            {
                target = document.getElementById("experimental");
                rect = target.getBoundingClientRect();
            }
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
            if (this.state.widgetAttached && 
                this.state.widgetAttached.isAttached) {
                console.log(this.state.widgetAttached);
                console.log(this.state.widgetAttached.isAttached);
                Widget.detach(this.state.widgetAttached);
            }
            this.setState({ widgetAttached: widget });

            Widget.attach(widget, document.body);
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
        switch (command) {
            case "bullet_list":
                return;
            case "ordered_list":
                return;
            case "blockquote":
                return;
            default:
                const newState = [...this.state.activeMarks];
                if (this.state.activeMarks.includes(command)) {
                    newState.splice(newState.indexOf(command), 1);
                }
                else {
                    newState.push(command);
                }
                this.setState({activeMarks: newState});
        }

    }

    
    /**
     * Renders the rich text menu component.
     */
    render() {

        const tooltips = ["bold", "italic", "underline", "strikethrough", "text-styles", "bulleted-list", "numbered-list", "blockquote", "code", "link", "image"];
        // const marks = ["stick", "strong", "em", "underline", "strikethrough", "heading", "stick", "bullet_list", "ordered_list", "blockquote", "code", "stick", "link", "image"];
        const marks = ["stick", "strong", "em", "underline", "heading", "experimental"];
        return (
            <div className="menu">
                    {marks.map((item, idx) => {
                            return <MenuItem 
                            format={item} 
                            handleClick={this.handleClick} 
                            active={this.state.activeMarks.includes(item) || this.state.activeWrapNodes.includes(item)} 
                            cancelled={this.state.inactiveMarks.includes(item)}
                            tooltip={tooltips[idx]}
                            key={idx} />
                    })}
            </div>
        );
    }
}
