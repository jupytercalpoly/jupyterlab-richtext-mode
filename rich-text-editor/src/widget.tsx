import { Widget } from "@phosphor/widgets";
import { EditorView } from "prosemirror-view";
import React from 'react';
import ReactDOM from 'react-dom';
import RichTextMenu from "./RichTextMenu";

export class ProsemirrorWidget extends Widget {

    // private _view: EditorView<any>;

    constructor() {
        super();
    }

    renderMenu(view: EditorView<any>) {
        ReactDOM.render(<RichTextMenu view={view} />, this.node);
    }
}