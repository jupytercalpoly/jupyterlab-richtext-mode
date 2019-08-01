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
import { ProseMirrorEditor } from './prosemirror/ProseMirrorEditor';

// import { ReactWidget } from "@jupyterlab/apputils";
// import {EditorState} from "prosemirror-state"
// import {EditorView} from "prosemirror-view"
// import {keymap} from "prosemirror-keymap"
// import {baseKeymap} from "prosemirror-commands"
// import { schema } from "prosemirror-schema-basic"
// import RichTextMenu from "./RichTextMenu";
// import React from 'react';
import { ProsemirrorWidget } from './widget';
const MD = require('markdown-it')();

//@ts-ignore
function activateMarkdownTest(app: JupyterFrontEnd, nbTracker: INotebookTracker) {


  // nbTracker.currentChanged.connect(() => {
  //   console.log(nbTracker.currentWidget)
  //   let cells = nbTracker.currentWidget.model.cells;
  //   console.log(cells);
  //   console.log(cells.length);
  //   for (let i = 0; i < 8; i++) {
  //     // console.log(cells);
  //     let cell = cells.get(i);
  //     console.log(cell);
  //       if (cell instanceof MarkdownCell) {
  //         cell.node.addEventListener('dblclick', (event: Event) => {
  //           event.preventDefault();
  //           event.stopPropagation();
  //           console.log("event handled!!");
  
  //           const widget = new ProseMirrorEditor((cell as MarkdownCell));
  //           cell.inputArea.renderInput(widget);   
  //           });
  //     }

  // });



  nbTracker.currentChanged.connect(() => {
    let prosemirrorWidget = new ProsemirrorWidget();
    nbTracker.currentWidget.toolbar.insertAfter("cellType", "rich-text-menu", prosemirrorWidget);
    console.log(MD.render('# markdown-it rulezz!'));
    nbTracker.activeCellChanged.connect(() => {
      // if (nbTracker.activeCell) {
        
      //   nbTracker.activeCell.node.addEventListener('dblclick', (event: Event) => {
      //         event.preventDefault();
      //         event.stopPropagation();
      //         console.log("event handled!!");
      //         if (nbTracker.activeCell instanceof MarkdownCell) {
      //           const markdownCell = nbTracker.activeCell;
      //           const widget = new ProseMirrorWidget(markdownCell);
      //           markdownCell.inputArea.renderInput(widget);     
      //   }});
      let activeCell = nbTracker.activeCell;
  
        if (activeCell instanceof MarkdownCell) { // Adds menu as a left panel.
          // let iter = nbTracker.currentWidget.toolbar.names();
          // let it = iter.next();
          // while (it) {
          //   console.log(it);
          //   it = iter.next();
          // }

          prosemirrorWidget.show();
          prosemirrorWidget.renderMenu((activeCell.editor as ProseMirrorEditor).view,
                                        activeCell.model);
        }
        else {
          prosemirrorWidget.hide();
        }
      })
  })
  
  

  // createRunCommand(app, nbTracker);

}

// function createRunCommand(app: JupyterFrontEnd, nbTracker: INotebookTracker) {

//   const ctrlRunCommand = "rich-text:run-markdown-cell";
//   app.commands.addCommand(ctrlRunCommand, {
//     execute: () => {
//       const activeCellPanel = (nbTracker.activeCell.layout as PanelLayout).widgets[1];
//       const activeCellInputArea = (activeCellPanel.layout as PanelLayout).widgets[1];
//       const activeCellProsemirrorEditor = (activeCellInputArea.layout as PanelLayout).widgets[2];
//       (activeCellProsemirrorEditor as ProseMirrorWidget).runCommand();
//     }
//   })

//   const shiftRunCommand = "rich-text:run-markdown-cell-and-advance";
//   app.commands.addCommand(shiftRunCommand, {
//     execute: () => {
//       app.commands.execute("rich-text:run-markdown-cell")
//       app.commands.execute("notebook:run-cell-and-select-next");
//       // NotebookActions.run((nbTracker.currentWidget as NotebookPanel).content);
//       console.log(app.commands);
//       // console.log(nbTracker.activeCell);
//     }
//   });

//   app.commands.addKeyBinding({
//     command: shiftRunCommand,
//     keys: ["Shift Enter"],
//     selector: '.editor'
//   });

//   app.commands.addKeyBinding({
//     command: ctrlRunCommand,
//     keys: ["Ctrl Enter"],
//     selector: '.editor'
//   });


// }

/**
 * Overrides the NotebookPanel content factory to replace Markdown editor with ProseMirror editor.
 * @param app - Application front end.
 */
//@ts-ignore
function overrideContentFactory(app: JupyterFrontEnd) {
  console.log("rich-text-mode:add-editor activated!");

  // let editorHost = createProseMirrorEditor();
  // return new ContentFactoryEditor({editorFactory: (options: {host: editorHost})});
  return new ContentFactoryEditor();
}

// function createProseMirrorEditor() {
//   let wrapper = document.createElement("div");
//   new EditorView(wrapper, {
//     state: EditorState.create({
//         schema,
//         plugins: [
//             keymap(baseKeymap)
//         ]
//     })
//     });
//   return wrapper;
// }
/**
 * Initialization data for the wyswiwyg-editor extension.
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
