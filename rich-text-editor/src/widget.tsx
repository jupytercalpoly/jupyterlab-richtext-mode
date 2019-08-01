import { Widget } from "@phosphor/widgets";
import { EditorView } from "prosemirror-view";
import React from 'react';
import ReactDOM from 'react-dom';
import RichTextMenu from "./RichTextMenu";
import { CodeEditor } from "@jupyterlab/codeeditor";

export class ProsemirrorWidget extends Widget {

    // private _view: EditorView<any>;

    constructor() {
        super();
    }

    renderMenu(view: EditorView<any>, model: CodeEditor.IModel) {
        ReactDOM.render(<RichTextMenu view={view} model={model}/>, this.node);
    }
}