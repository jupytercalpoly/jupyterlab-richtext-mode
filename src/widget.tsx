import { Widget,
    //  Menu, 
     MenuBar
    } from "@phosphor/widgets";
import { Cell } from "@jupyterlab/cells";
import React from 'react';
import ReactDOM from 'react-dom';
import RichTextMenu from "./RichTextMenu";
import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";
import { CommandRegistry } from "@phosphor/commands";
// import * as menu_scripts from "./headingmenu";
// import { ReactWidget } from "@jupyterlab/apputils";
import { schema } from "./prosemirror/prosemirror-schema";
import { EditorView } from "prosemirror-view";
import { setBlockType } from "prosemirror-commands";
export class ProsemirrorWidget extends Widget {

    private _view: EditorView<any>;



    constructor(commands: CommandRegistry) {
        super();
        this.createHeadingCommands(commands);

        

        // console.log(this.heading_menu);
    }


    renderMenu(activeCell: Cell, headingMenu: MenuBar) {
        this._view = (activeCell.editor as ProseMirrorEditor).view;
        let model = activeCell.model;
        // console.log(activeCell.model.id);
        ReactDOM.render(<RichTextMenu view={this._view} model={model} key={activeCell.model.id}/>, this.node)
        Widget.attach(headingMenu, this.node);

    }

    createHeadingCommands(commands: CommandRegistry) {
        let that = this;
        commands.addCommand('heading-normal', {
            label: "Normal Text",
            execute() {
                setBlockType(schema.nodes.heading, {level: 5})(that._view.state, that._view.dispatch);
            }
        })
        commands.addCommand('heading-1', {
            label: "Heading 1",
            execute() {
                setBlockType(schema.nodes.heading, {level: 1})(that._view.state, that._view.dispatch);
            }
        })
        commands.addCommand('heading-2', {
            label: "Heading 2",
            execute() {
                setBlockType(schema.nodes.heading, {level: 2})(that._view.state, that._view.dispatch);
            }
        })
        commands.addCommand('heading-3', {
            label: "Heading 3",
            execute() {
                setBlockType(schema.nodes.heading, {level: 3})(that._view.state, that._view.dispatch);
            }
        })
        commands.addCommand('heading-4', {
            label: "Heading 4",
            execute() {
                setBlockType(schema.nodes.heading, {level: 4})(that._view.state, that._view.dispatch);
            }
        })
        commands.addCommand('heading-5', {
            label: "Heading 5",
            execute() {
                setBlockType(schema.nodes.heading, {level: 5})(that._view.state, that._view.dispatch);
            }
        })
        commands.addCommand('heading-6', {
            label: "Heading 6",
            execute() {
                setBlockType(schema.nodes.heading, {level: 6})(that._view.state, that._view.dispatch);
            }
        })         
    }
}
