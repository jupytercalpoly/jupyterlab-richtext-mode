import {EditorState, Transaction} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {
    Widget
} from "@phosphor/widgets";
import {keymap} from "prosemirror-keymap"
import {baseKeymap} from "prosemirror-commands"
import * as Markdown from "prosemirror-markdown"
import { MarkdownCell, MarkdownCellModel } from '@jupyterlab/cells';

export default class ProseMirrorEditor extends Widget {

    /**
     * The editor itself.
     */
    private _view: EditorView<any>;

    /**
     * The 'div' element that wraps around the editor.
     */
    private _wrapper: HTMLDivElement;

    /**
     * The currently active Markdown cell model for updating.
     */
    private _model: MarkdownCellModel;

    /**
     * The currently active Markdown cell. 
     */
    private _cell: MarkdownCell;

    /**
     *  Creates a Prosemirror text editor and attaches it to the widget's node. 
     * @param model Should replace with an IOption object at some point, but takes in Markdown cell model for updating.
     * 
     */
    constructor(cell: MarkdownCell) {
        super();
        this.addClass("header");

        // let that = this;
        this._cell = cell;
        this._model = (cell.model as MarkdownCellModel);
        let source = this._model.toJSON().source;
        console.log(source);
        this._wrapper = document.createElement("div");
        this._view = new EditorView(this._wrapper, {
        state: EditorState.create({
            doc: (Markdown as any).defaultMarkdownParser.parse(
                typeof source === "string" ? source : source.join('')
            ),
            plugins: [
                keymap(baseKeymap)
            ]
        })
        // dispatchTransaction(transaction: Transaction) {
        //     that.changedState(transaction);
        //     console.log("transaction made");
        // }
        });
        
        this.node.appendChild(this._wrapper);
        console.log(this._view);

    }

    /**
     * Updates the active Markdown cell's value based on the current state of the editor.
     * @param transaction Represents the state of the editor after a change is made.
     */
    protected changedState(transaction: Transaction) {
        const newState = this._view.state.apply(transaction);
        this._view.updateState(newState);

    }    

    public runCommand() {
        const source = (Markdown as any).defaultMarkdownSerializer.serialize(
            this._view.state.doc
          );
          if (source.trim() === this._model.value.text.trim()) {
            return;
          }
          this._model.value.text = source;
          this._cell.rendered = true;

          
    }
}

