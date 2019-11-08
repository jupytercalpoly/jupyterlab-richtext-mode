import { CodeEditor } from "@jupyterlab/codeeditor";
import { Signal } from "@phosphor/signaling";
import { UUID } from "@phosphor/coreutils";
import { IDisposable, DisposableDelegate } from "@phosphor/disposable";
import { ArrayExt } from '@phosphor/algorithm';
import { EditorState, 
  TextSelection
  // Plugin
 } from "prosemirror-state";
import { EditorView, 
  // Decoration, 
  // DecorationSet
 } from "prosemirror-view";
import * as Markdown from '../prosemirror/markdown';
import {keymap} from "prosemirror-keymap";
import {baseKeymap} from "prosemirror-commands";
import {buildKeymap} from "./prosemirror-scripts";
import { schema, schema_markdown } from "./prosemirror-schema";
import { CodeBlockView, CodeBlockMarkdownView, InlineMathView, BlockMathView, ImageView } from "./nodeviews";
import { createInputRules } from "./inputrules";
import { inputRules } from "prosemirror-inputrules";
// import { Node } from "prosemirror-model";
// import markdownit from "markdown-it/lib";
import { Transaction } from "prosemirror-state";
import { IMarkdownCellModel } from "@jupyterlab/cells";
import { history, undo, redo, 
  // undo, redo 
} 
  from "prosemirror-history";
/**
 * The height of a line in the editor.
 */
const LINE_HEIGHT: number = 17;

/**
 * Default number for all number attributes, for now.
 */
const DEFAULT_NUMBER: number = 0;


export class ProseMirrorEditor implements CodeEditor.IEditor {
    
    constructor(options: ProseMirrorEditor.IOptions, markdownModel: IMarkdownCellModel) {
      console.log("editor created!");
        let host = (this.host = options.host);
        host.classList.add("jp-RenderedHTMLCommon");
        host.classList.add('jp-ProseMirror');
        host.addEventListener('focus', this, true);
        host.addEventListener('blur', this, true);
        host.addEventListener('scroll', this, true);      
        
        this._uuid = options.uuid || UUID.uuid4();     
        
        let model = (this._model = options.model);
        // let config = (this._config = options.config || CodeEditor.defaultConfig);
        this._cellModel = markdownModel;
        this.isMarkdown = (markdownModel.metadata.get("markdownMode") as boolean);
        console.log(this.isMarkdown);
        if (this.isMarkdown === undefined) {
          this.isMarkdown = false;
        }
        this._view = this.isMarkdown ? Private.createMarkdownEditor(host, model, this._cellModel) : Private.createEditor(host, model);
        

        // // Connect to changes.
        // model.value.changed.connect(this._onValueChanged, this);
    }

  /**
   * A signal emitted when either the top or bottom edge is requested.
   */
  readonly edgeRequested = new Signal<this, CodeEditor.EdgeLocation>(this);

  /**
   * The DOM node that hosts the editor.
   */
  readonly host: HTMLElement;  

  /**
   * The editor itself.
   */
  get view(): EditorView<any> {
    return this._view;
  }

  /**
   * The uuid of this editor.
   */
  get uuid(): string {
    return this._uuid;
  }
  set uuid(value: string) {
    this._uuid = value;
  }

  /**
   * Tests whether the editor is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }
  
  switchEditor() {
    let state = this._view.state;
    let that = this;
    console.log(Markdown.serializer.serialize(state.doc));
    this._view.destroy();
    if (!this.isMarkdown) {
      this._view = new EditorView(this.host, {
        state: EditorState.create({
            doc: schema_markdown.nodes.doc.create({}, schema_markdown.nodes.code_block.create({params: "markdown"}, schema_markdown.text(Markdown.serializer.serialize(state.doc))))
            ,
            plugins: [
                // keymap(buildKeymap(schema)),
                keymap(baseKeymap),
                // inputRules({rules: createInputRules()}),
                // testPlugin
            ]
        }),
        nodeViews: {
          code_block(node, view, getPos) { return new CodeBlockMarkdownView(node, view, getPos)},
  
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
          // focus: () => {
          //   this.view.focus();
          //   return true;
          // }
        },
        dispatchTransaction(transaction: Transaction) {
          // console.log(this.state.doc.textContent);
          let state = this.state.apply(transaction);
          that._view.updateState(state);
          that._cellModel.value.text = this.state.doc.textContent;

        }
        
    });
    this._view.focus();
    let tr = this._view.state.tr;
    tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 3, tr.selection.from + 3));
    this._view.dispatch(tr);
    // this._view.focus();
    this._cellModel.metadata.set("markdownMode", true);
    console.log(this._cellModel.metadata.get("markdownMode"));
    this.isMarkdown = true;
    }
    else {
      this._view = new EditorView(this.host, {
        state: EditorState.create({
          doc: Markdown.parser.parse(state.doc.textContent),
          plugins: [
            history(),
            keymap(buildKeymap(schema)),
            keymap(baseKeymap),
            inputRules({rules: createInputRules()}),
            // testPlugin
        ]
        }),
        nodeViews: {
          code_block(node, view, getPos) { return new CodeBlockView(node, view, getPos)},
          inline_math(node, view, getPos) { return new InlineMathView(node, view, getPos)},
          image(node) {return new ImageView(node)},
          block_math(node, view, getPos) { return new BlockMathView(node, view, getPos)}
        },
        handleDOMEvents: {
          copy: (view: EditorView, event: Event): boolean => {
              // event.preventDefault();
              view.focus();
              console.log(view.state.selection.$from.node());
              document.execCommand("copy");
              // view.dom.dispatchEvent(new ClipboardEvent("copy"));
              return true;
          }
        }
      })
      this._cellModel.metadata.set("markdownMode", false);
      this.isMarkdown = false;
    }

  console.log(this._view.state.schema);
  this._view.focus();
  
  }
  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    
    this._isDisposed = true;
    this.host.removeEventListener('focus', this, true);
    this.host.removeEventListener('blur', this, true);
    this.host.removeEventListener('scroll', this, true);
    // this._keydownHandlers.length = 0;
    // this._poll.dispose();
    Signal.clearData(this);
  }  

  /**
   * The height of a line in the editor in pixels.
   */
  get lineHeight(): number {
    return LINE_HEIGHT;
  }
  /**
   * The widget of a character in the editor in pixels.
   */
  get charWidth(): number {
    return DEFAULT_NUMBER;
  }

  /**
   * Get the number of lines in the editor.
   */
  get lineCount(): number {
    return DEFAULT_NUMBER;
  }

  /**
   * Returns a model for this editor.
   */
  get model(): CodeEditor.IModel {
    return this._model;
  }

  /**
   * The selection style of this editor.
   */
  get selectionStyle(): CodeEditor.ISelectionStyle {
    return this._selectionStyle;
  }
  set selectionStyle(value: CodeEditor.ISelectionStyle) {
    this._selectionStyle = value;
  }

  /**
   * Add a keydown handler to the editor.
   *
   * @param handler - A keydown handler.
   *
   * @returns A disposable that can be used to remove the handler.
   */
  addKeydownHandler(handler: CodeEditor.KeydownHandler): IDisposable {
    this._keydownHandlers.push(handler);
    return new DisposableDelegate(() => {
      ArrayExt.removeAllWhere(this._keydownHandlers, val => val === handler);
    });
  }

 /**
   * Handle the DOM events for the editor.
   *
   * @param event - The DOM event sent to the editor.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the editor's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    // switch (event.type) {
    //   case 'focus':
    //     this._evtFocus(event as FocusEvent);
    //     break;
    //   case 'blur':
    //     this._evtBlur(event as FocusEvent);
    //     break;
    //   case 'scroll':
    //     this._evtScroll();
    //     break;
    //   default:
    //     break;
    // }
  }


  revealPosition(position: CodeEditor.IPosition): void {

  }

  revealSelection(selection: CodeEditor.IRange): void {

  }

  setCursorPosition(position: CodeEditor.IPosition): void {

  }

  getCoordinateForPosition(position: CodeEditor.IPosition): CodeEditor.ICoordinate {
      return null;
  }

  getCursorPosition(): CodeEditor.IPosition {
      return null;
  }

  getLine(line: number): string | undefined {
      return "";
  }

  getOffsetAt(position: CodeEditor.IPosition): number {
      return DEFAULT_NUMBER;
  }

  getPositionAt(offset: number): CodeEditor.IPosition | undefined {
      return undefined;
  }

  getPositionForCoordinate(coordinate: CodeEditor.ICoordinate): 
    CodeEditor.IPosition | null {
        return null;
    }

  getSelection(): CodeEditor.IRange {
      return null;
  }

  getSelections(): CodeEditor.IRange[] {
      return [];
  }

  getTokenForPosition(position: CodeEditor.IPosition): CodeEditor.IToken {
      return null;
  }

  getTokens(): CodeEditor.IToken[] {
      return [];
  }

  hasFocus(): boolean {
      return true;
  }

  newIndentedLine(): void {
      
  }

  redo(): void {
    redo(this._view.state, this._view.dispatch);
  }

  refresh(): void {

  }

  resizeToFit(): void {

  }

  setSelection(selection: CodeEditor.IRange): void {

  }

  setSelections(selections: CodeEditor.IRange[]): void {
      
  }  

  setSize(size: CodeEditor.IDimension | null): void {

  }

  undo(): void {
    undo(this._view.state, this._view.dispatch);
  }

  getOption<K extends keyof ProseMirrorEditor.IConfig>(option: K): ProseMirrorEditor.IConfig[K] {
      return null;
  }
  blur(): void {
    (this._view.dom as HTMLElement).blur();
  }

  clearHistory(): void {

  }

  focus(): void {
      this._view.focus();
  }
  
    /**
   * Set a config option for the editor.
   */
  setOption<K extends keyof ProseMirrorEditor.IConfig>(
    option: K,
    value: ProseMirrorEditor.IConfig[K]
  ): void {
    // // Don't bother setting the option if it is already the same.
    // if (this._config[option] !== value) {
    //   this._config[option] = value;
    //   Private.setOption(this.editor, option, value, this._config);
    // }
  }

  
  private _model: CodeEditor.IModel;
  private _uuid = '';
  private _isDisposed = false;
  private _keydownHandlers = new Array<CodeEditor.KeydownHandler>();
  private _selectionStyle: CodeEditor.ISelectionStyle;
  private _view: EditorView<any>;
  private _cellModel: IMarkdownCellModel;
  public isMarkdown = false;
//   private readonly _config: Partial<ProseMirrorEditor.IConfig>;
}

/**
 * The namespace for `ProseMirrorEditor` statics.
 */
export namespace ProseMirrorEditor {

    export interface IOptions extends CodeEditor.IOptions {
            /**
     * The configuration options for the editor.
     */
    config?: Partial<IConfig>;
    }

  /**
   * The configuration options for a prosemirror editor.
   */
  export interface IConfig extends CodeEditor.IConfig {

  }
}
  /**
   * The default configuration options for an editor.
   */

/**
 * The namespace for module private data.
 */
namespace Private {
  export function createMarkdownEditor(
    host: HTMLElement,
    model: CodeEditor.IModel,
    cellModel: IMarkdownCellModel
  ): EditorView<any> {
    console.log("creating markdown editor");
    
    let view = new EditorView(host, {
      state: EditorState.create({
          doc: schema_markdown.nodes.doc.create({}, schema_markdown.nodes.code_block.create({params: "markdown"}, schema_markdown.text(model.value.text)))
          ,
          plugins: [
              // keymap(buildKeymap(schema)),
              keymap(baseKeymap),
              // testPlugin
          ]
      }),
      nodeViews: {
        code_block(node, view, getPos) { return new CodeBlockMarkdownView(node, view, getPos)},

      },
      handleDOMEvents: {
        copy: (view: EditorView, event: Event): boolean => {
            // event.preventDefault();
            view.focus();
            console.log(view.state.selection.$from.node());
            document.execCommand("copy");
            // view.dom.dispatchEvent(new ClipboardEvent("copy"));
            return true;
        }
      },
      dispatchTransaction(transaction: Transaction) {
        let state = this.state.apply(transaction);
        view.updateState(state);
        cellModel.value.text = this.state.doc.textContent;

      }
  });

  return view;
  }

  export function createEditor(
        host: HTMLElement,
        model: CodeEditor.IModel
        // config: Partial<ProseMirrorEditor.IConfig>
    ): EditorView<any> {
        // let {
        //     fontFamily,
        //     fontSize,
        //     lineHeight,
        //     lineNumbers,
        //     lineWrap,
        //     readOnly,
        //     tabSize,
        //     insertSpaces,
        //     matchBrackets,
        //     autoClosingBrackets,
        //     wordWrapColumn, 
        //     rulers,
        //     codeFolding
        // } = config;
        let initValue = model.value.text;
        
        // console.log(markdownit({html: true}).parse("<ins>asd</ins>", {}));
        // let md = require('markdown-it')().use(require('markdown-it-mathjax')());
        // console.log(md.render('$1 *2* 3$'));
        // console.log(md.parse('$asd$ $$asd$$', {}));
        // console.log(markdownit().use(require("markdown-it-mathjax")).parse("$asd$", {}));
        // console.log(markdownit().use(require("markdown-it-mathjax")).render('$asd$'));
        // let testPlugin = new Plugin({
        //   props: {
        //     decorations(state: EditorState) {
        //       const selection = state.selection;
        //       const decorations: Decoration[] = [];
        //       state.doc.nodesBetween(selection.from, selection.to, (node: Node, pos: number, parent: Node, index: number) => {
        //         if (node.type.name === "inline_math" || node.type.name === "block_math") {
        //           console.log("we boutta decorate this math");
        //           decorations.push(Decoration.node(pos, pos + node.nodeSize, {class: 'selected-math'}));

        //         }
        //       })
        //       return DecorationSet.create(state.doc, decorations);
        //     }
        //   }
        // });
        let view = new EditorView(host, {
            state: EditorState.create({
                doc: Markdown.parser.parse(
                    initValue
                ),
                plugins: [
                    history(),
                    keymap(buildKeymap(schema)),
                    keymap(baseKeymap),
                    inputRules({rules: createInputRules()}),
                    // testPlugin
                ]
            }),
            nodeViews: {
              code_block(node, view, getPos) { return new CodeBlockView(node, view, getPos)},
              inline_math(node, view, getPos) { return new InlineMathView(node, view, getPos)},
              image(node) {return new ImageView(node)},
              block_math(node, view, getPos) { return new BlockMathView(node, view, getPos)}
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
              // keydown: (view: EditorView, event: Event): boolean => {
              //   if ((event as KeyboardEvent).metaKey) {
              //     let key = (event as KeyboardEvent).key;
              //     switch (key) {
              //       case "z":
              //         undo(view.state, view.dispatch);
              //         event.preventDefault();
              //         break;
              //       case "y":
              //         redo(view.state, view.dispatch);
              //         event.preventDefault();
              //         break;
              //     }
              //   }
              //   return true;
              // }
            }
            
            // dispatchTransaction(transaction: Transaction) {
            //     console.log(transaction);
            //     // model.value.insert(0, "ayy lmao");
            //     // console.log(model.value.text);
            //     let serializer = Markdown.serializer;

            //     const source = serializer.serialize(
            //         transaction.doc
            //     );
            //     console.log(source);

            //     model.value.text = source;
            //     view.updateState(view.state.apply(transaction));
                
            // }
        });
        console.log(view.state.schema);
        return view;
    }
}