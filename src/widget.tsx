import { Widget } from "@phosphor/widgets";
import { Cell, MarkdownCell } from "@jupyterlab/cells";
import React from 'react';
import ReactDOM from 'react-dom';
import RichTextMenu from "./RichTextMenu";
// import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";
import { CommandRegistry } from "@phosphor/commands";
// import * as menu_scripts from "./headingmenu";
// import { ReactWidget } from "@jupyterlab/apputils";

import { EditorView } from "prosemirror-view";
import { CodeBlockView,  InlineMathView, BlockMathView, ImageView } from "./prosemirror/nodeviews";
import { createInputRules } from "./prosemirror/inputrules";
import { inputRules } from "prosemirror-inputrules";
import { history } from "prosemirror-history";
import {keymap} from "prosemirror-keymap";
import {baseKeymap} from "prosemirror-commands";
import {buildKeymap} from "./prosemirror/prosemirror-scripts";
import { EditorState, 

   } from "prosemirror-state";
import * as Markdown from './prosemirror/markdown';
import { schema } from "./prosemirror/prosemirror-schema";
import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";
import { IStateDB } from '@jupyterlab/coreutils';

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

/**
 * The class name added to a rendered input area.
 */
const RENDERED_CLASS = 'jp-mod-rendered';

export class ProsemirrorMarkdownCell extends MarkdownCell {
    constructor(options: MarkdownCell.IOptions) {
        super(options);
        console.log("Creating the prosemirror markdown cell.");
        super.rendered = true;
    }   
  /**
   * Whether the cell is rendered.
   */
  get rendered(): boolean {
    return super.rendered;
  }
  set rendered(value: boolean) {
    if (value) {
      super.rendered = value;
    }
  }

  get isProsemirror(): boolean {
    return this._isProsemirror;
  }

  set isProsemirror(value: boolean) {
    if (value) {
      this.renderInput(null);
    }
    else {
      super.rendered = false;
      this.view.editable = false;
    }
  }
  /**
   * Render an input instead of the text editor.
   */
  protected renderInput(widget: Widget): void {
    this.addClass(RENDERED_CLASS);
    let prosemirrorWidget = new Widget();
    let initValue = this.model.value.text;
    let view = new EditorView(prosemirrorWidget.node, {
        state: EditorState.create({
            doc: Markdown.parser.parse(
                initValue
            ),
            plugins: [
                history(),
                keymap(buildKeymap(schema)),
                keymap(baseKeymap),
                inputRules({rules: createInputRules()})
                // testPlugin
            ]
        }),
        nodeViews: {
          code_block(node, view, getPos) { return new CodeBlockView(node, view, (getPos as () => number))},
          inline_math(node, view, getPos) { return new InlineMathView(node, view, (getPos as () => number))},
          image(node) {return new ImageView(node)},
          block_math(node, view, getPos) { return new BlockMathView(node, view, (getPos as () => number))}
        },
        handleDOMEvents: {
          copy: (view: EditorView, event: Event): boolean => {
              // event.preventDefault();
              view.focus();
              console.log(view.state.selection.$from.node());
              document.execCommand("copy");
              // view.dom.dispatchEvent(new ClipboardEvent("copy"));
              return true;
          },
        }
    });
    this.inputArea.renderInput(prosemirrorWidget);
    this.view = view;
  }

  private _isProsemirror = true;
  view: EditorView = null;
}