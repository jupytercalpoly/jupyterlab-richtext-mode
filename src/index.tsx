import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import '../style/index.css';
import { INotebookTracker, 
  NotebookPanel,

  } from '@jupyterlab/notebook';

import { MarkdownCell } from '@jupyterlab/cells';

import ContentFactoryEditor from './factory';

import { ProsemirrorWidget} from './widget';
import { CommandRegistry } from '@lumino/commands';
import { ContextMenu, Menu } from '@lumino/widgets';
import { IStateDB } from '@jupyterlab/statedb';



function activateRichTextEditor(app: JupyterFrontEnd, nbTracker: INotebookTracker, state: IStateDB) {
  let prosemirrorWidget = new ProsemirrorWidget(app.commands);
  console.log("test");
  Promise.all([state.fetch("test-markdown:math-enabled"), app.restored])
        .then(([saved])=>{

            console.log("checking math!");
            console.log(saved);

        });

  addKeybindings(app.commands, nbTracker, prosemirrorWidget, state);
  addContextMenuItems(app.contextMenu, app.commands);
  nbTracker.currentChanged.connect(() => {
    if (nbTracker.currentWidget) {
      nbTracker.currentWidget.toolbar.insertAfter("cellType", "rich-text-menu", prosemirrorWidget);
      nbTracker.activeCellChanged.connect(() => {
        let activeCell = nbTracker.activeCell;
          
          if (activeCell instanceof MarkdownCell) { 
            activeCell.editor.focus();
            console.log(activeCell.editor.hasFocus);
            prosemirrorWidget.renderMenu(activeCell, state, app.commands);
          }
          else {
            prosemirrorWidget.renderInactiveMenu(state);
          }
  
        })
    }

  })

}

function addContextMenuItems(contextMenu: ContextMenu, commands: CommandRegistry) {
  contextMenu.addItem({
    command: "prosemirror-copy-menu",
    selector: ".jp-Notebook .jp-Cell",
    rank: 10
  })

  let markdownSubmenu = new Menu({commands});
  markdownSubmenu.title.label = "Markdown Cell Editor View";
  markdownSubmenu.addItem({
    command: "prosemirror-switch-to-markdown",
  });
  markdownSubmenu.addItem({
    command: "prosemirror-switch-from-markdown",
  });
  contextMenu.addItem({

    selector: ".jp-mod-active .ProseMirror",
    submenu: markdownSubmenu,
    type: "submenu",
  })
}

function addKeybindings(commands: CommandRegistry, nbTracker: INotebookTracker, prosemirrorWidget: ProsemirrorWidget, state: IStateDB) {

  commands.addCommand("prosemirror-bold", {
    execute: () => {
      let currentEditor = document.querySelector(".ProseMirror-focused");
      currentEditor.dispatchEvent(new KeyboardEvent("keydown", {metaKey: true, key: "b"}));
    }
  })

  commands.addCommand("prosemirror-italic", {
    execute: () => {
      let currentEditor = document.querySelector(".ProseMirror-focused");
      currentEditor.dispatchEvent(new KeyboardEvent("keydown", {metaKey: true, key: "i"}));
    }
  })


  commands.addCommand("prosemirror-tab", {
    execute: () => {
      let currentEditor = document.querySelector(".ProseMirror-focused");
      currentEditor.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab"}));
    }
  })

  commands.addCommand("prosemirror-shift-tab", {
    execute: () => {
      let currentEditor = document.querySelector(".ProseMirror-focused");
      console.log(currentEditor.dispatchEvent(new KeyboardEvent("keydown", {shiftKey: true, key: "Tab"})));
    }
  })
  commands.addCommand("prosemirror-copy-menu", {
    label: "Copy Content",
    execute: () => {
      let currentEditor = document.querySelector(".jp-mod-active .ProseMirror");

      console.log(currentEditor.dispatchEvent(new ClipboardEvent("copy")));
    }
  })

  commands.addKeyBinding({
    command: "prosemirror-bold",
    keys: ['Accel B'],
    selector: '.ProseMirror-focused'
  });

  commands.addKeyBinding({
    command: "prosemirror-italic",
    keys: ['Accel I'],
    selector: '.ProseMirror-focused'
  });


  commands.addKeyBinding({
    command: "prosemirror-tab",
    keys: ["Tab"],
    selector: ".ProseMirror-focused"
  });

  commands.addKeyBinding({
    command: "prosemirror-shift-tab",
    keys: ["Shift Tab"],
    selector: ".ProseMirror-focused"
  });

}
/**
 * Overrides the NotebookPanel content factory to replace Markdown editor with ProseMirror editor.
 * @param app - Application front end.
 */
function overrideContentFactory(app: JupyterFrontEnd) {
  console.log("rich-text-mode:add-editor activated!");
  return new ContentFactoryEditor();
}

/**
 * Initialization data for the rich-text-editor extension.
 */
const richTextEditor: JupyterFrontEndPlugin<void> = {
  id: 'rich-text-mode',
  autoStart: true,
  requires: [INotebookTracker, IStateDB],
  activate: activateRichTextEditor
};

const addEditorExtension: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
  id: 'rich-text-mode:add-editor',
  autoStart: true,
  provides: NotebookPanel.IContentFactory,
  activate: overrideContentFactory
}


export default [
  richTextEditor, 
  addEditorExtension];
