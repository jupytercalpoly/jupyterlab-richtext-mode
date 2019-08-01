import { Widget } from "@phosphor/widgets";
import { Cell } from "@jupyterlab/cells";
import React from 'react';
import ReactDOM from 'react-dom';
import RichTextMenu from "./RichTextMenu";
import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";


export class ProsemirrorWidget extends Widget {

    // private _view: EditorView<any>;

    constructor() {
        super();
    }

    renderMenu(activeCell: Cell) {
        let view = (activeCell.editor as ProseMirrorEditor).view;
        let model = activeCell.model;
        ReactDOM.render(<RichTextMenu view={view} model={model} key={activeCell.model.id}/>, this.node);
    }
}