import { Widget } from "@lumino/widgets";
import { Cell } from "@jupyterlab/cells";
import React from 'react';
import ReactDOM from 'react-dom';
import RichTextMenu from "./RichTextMenu";
// import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";
import { CommandRegistry } from "@lumino/commands";
// import * as menu_scripts from "./headingmenu";
// import { ReactWidget } from "@jupyterlab/apputils";

import { EditorView } from "prosemirror-view";

import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";
import { IStateDB } from '@jupyterlab/statedb';

// import { MathJaxTypesetter } from "@jupyterlab/mathjax2";

export class ProsemirrorWidget extends Widget {

    private _view: EditorView<any>;

    constructor(commands: CommandRegistry) {
        super();
        // this.createHeadingCommands(commands);

        

        // console.log(this.heading_menu);
    }


    renderMenu(activeCell: Cell, state: IStateDB, commands: CommandRegistry) {
        this._view = (activeCell.editor as ProseMirrorEditor).view;
        let model = activeCell.model;
        let linkMenuWidget = new Widget();
        let imageMenuWidget = new Widget();
        let headingMenuWidget = new Widget();
        let codeMenuWidget = new Widget();
        let codeLanguageMenuWidget = new Widget();
        let experimentalMenuWidget = new Widget();
        experimentalMenuWidget.id = "experimental";
        let listExperimentalMenuWidget = new Widget();
        let mathExperimentalMenuWidget = new Widget();
        ReactDOM.render(<RichTextMenu view={this._view} model={model} linkMenuWidget={linkMenuWidget} 
            imageMenuWidget={imageMenuWidget} headingMenuWidget={headingMenuWidget} 
            codeMenuWidget={codeMenuWidget}
            codeLanguageMenuWidget={codeLanguageMenuWidget}
            commands={commands}
            experimentalMenuWidget={experimentalMenuWidget}
            listExperimentalMenuWidget={listExperimentalMenuWidget}
            mathExperimentalMenuWidget={mathExperimentalMenuWidget}
            state={state}
            key={`${activeCell.model.id}
            ${activeCell.model.metadata.get("markdownMode") !== undefined ? activeCell.model.metadata.get("markdownMode") : false}`}/>, this.node)

    }

    renderInactiveMenu(state: IStateDB) {
        ReactDOM.render(<RichTextMenu view={null}
                                      model={null}
                                      linkMenuWidget={null}
                                      imageMenuWidget={null}
                                      headingMenuWidget={null}
                                      codeMenuWidget={null}
                                      codeLanguageMenuWidget={null}
                                      commands={null}
                                      experimentalMenuWidget={null}
                                      listExperimentalMenuWidget={null}
                                      mathExperimentalMenuWidget={null}
                                      state={state}
                                        />, this.node);
    }

}

export interface MenuWidgetObject {
    [key: string]: Widget
}
