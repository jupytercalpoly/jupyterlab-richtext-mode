import { CodeEditor } from "@jupyterlab/codeeditor";
import { Signal } from "@phosphor/signaling";
import { UUID } from "@phosphor/coreutils";
import { IDisposable, DisposableDelegate } from "@phosphor/disposable";
import { ArrayExt } from '@phosphor/algorithm';
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import * as Markdown from '../prosemirror/markdown';
import {keymap} from "prosemirror-keymap";
import {baseKeymap} from "prosemirror-commands";
// import { Transaction } from "prosemirror-state";
/**
 * The height of a line in the editor.
 */
const LINE_HEIGHT: number = 17;

/**
 * Default number for all number attributes, for now.
 */
const DEFAULT_NUMBER: number = 0;

export class ProseMirrorEditor implements CodeEditor.IEditor {
    
    constructor(options: ProseMirrorEditor.IOptions) {
        let host = (this.host = options.host);
        host.classList.add('jp-Editor');
        host.classList.add('jp-ProseMirror');
        host.addEventListener('focus', this, true);
        host.addEventListener('blur', this, true);
        host.addEventListener('scroll', this, true);      
        
        this._uuid = options.uuid || UUID.uuid4();     
        
        let model = (this._model = options.model);
        // let config = (this._config = options.config || CodeEditor.defaultConfig);
        this._view = Private.createEditor(host, model);
        

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
        let view = new EditorView(host, {
            state: EditorState.create({
                doc: Markdown.parser.parse(
                    initValue
                ),
                plugins: [
                    keymap(baseKeymap)
                ]
            }),
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
        return view;
    }
}