import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import '../style/index.css';
import { INotebookTracker, 
  NotebookPanel,
  //  NotebookActions, 
  //  NotebookPanel 
  } from '@jupyterlab/notebook';
// import ProseMirrorEditor from './ProsemirrorWidget';
// import { ProseMirrorEditor } from './prosemirror/ProseMirrorEditor';
import { MarkdownCell } from '@jupyterlab/cells';
// import {
//   // Panel,
//   PanelLayout
// } from '@phosphor/widgets';
import ContentFactoryEditor from './factory';
// import { CodeEditor } from '@jupyterlab/codeeditor';
// import ProseMirrorWidget from './ProsemirrorWidget';
// import { ProseMirrorEditor } from './prosemirror/ProseMirrorEditor';

// import { ReactWidget } from "@jupyterlab/apputils";
// import {EditorState} from "prosemirror-state"
// import {EditorView} from "prosemirror-view"
// import {keymap} from "prosemirror-keymap"
// import {baseKeymap} from "prosemirror-commands"
// import { schema } from "prosemirror-schema-basic"
// import RichTextMenu from "./RichTextMenu";
// import React from 'react';
import { ProsemirrorWidget } from './widget';



//@ts-ignore
function activateMarkdownTest(app: JupyterFrontEnd, nbTracker: INotebookTracker) {

  nbTracker.currentChanged.connect(() => {
    let prosemirrorWidget = new ProsemirrorWidget(app.commands);
    // nbTracker.currentWidget.toolbar.insertAfter("cellType", "heading-menu", menu_scripts.createHeadingMenu(app.commands));
    nbTracker.currentWidget.toolbar.insertAfter("cellType", "rich-text-menu", prosemirrorWidget);
    nbTracker.activeCellChanged.connect(() => {
      let activeCell = nbTracker.activeCell;
  
        if (activeCell instanceof MarkdownCell) { 
          activeCell.editor.focus();
          console.log(activeCell.editor.hasFocus);
          prosemirrorWidget.show();

          prosemirrorWidget.renderMenu(activeCell);
        }
        else {
          prosemirrorWidget.hide();
        }
      })
  })

}

/**
 * Overrides the NotebookPanel content factory to replace Markdown editor with ProseMirror editor.
 * @param app - Application front end.
 */
//@ts-ignore
function overrideContentFactory(app: JupyterFrontEnd) {
  console.log("rich-text-mode:add-editor activated!");
  return new ContentFactoryEditor();
}

/**
 * Initialization data for the rich-text-editor extension.
 */
const markdownTest: JupyterFrontEndPlugin<void> = {
  id: 'test-markdown',
  autoStart: true,
  requires: [INotebookTracker],
  activate: activateMarkdownTest
};

const addEditorExtension: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
  id: 'rich-text-mode:add-editor',
  autoStart: true,
  provides: NotebookPanel.IContentFactory,
  activate: overrideContentFactory
}


export default [
  markdownTest, 
  addEditorExtension];
