import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {
    Widget
} from "@phosphor/widgets";
import {keymap} from "prosemirror-keymap"
import {baseKeymap} from "prosemirror-commands"
import * as Markdown from "prosemirror-markdown"
import { MarkdownCell, MarkdownCellModel } from '@jupyterlab/cells';
import {
    Message
} from '@phosphor/messaging';

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

        this._cell = cell;
        this._model = (cell.model as MarkdownCellModel);

        let source = this._model.toJSON().source;
        // console.log(source);
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
        });
       
        this.node.appendChild(this._wrapper);

        this._model.contentChanged.connect(() => {
            console.log('changed!');
            this._cell.update();
        }) 
        // console.log(this._view);
        

    }  

    /**
     * The execute function for the 'Shift Enter' command for the ProseMirror editor. 
     * 
     * Serializes the current editor's value/text into Markdown, which updates the 
     * cell model's value, prompting the contentChanged signal, sending
     * an update request to the cell and thus rendering the Markdown.
     *
     */
    public runCommand(): void {

        const source = (Markdown as any).defaultMarkdownSerializer.serialize(
            this._view.state.doc
          );

        if (source.trim() === this._model.value.text.trim()) {
            this._cell.update();
            return ;
        }

          this._model.value.text = source;

    }

  /**
   * Handle the DOM events for the ProseMirror editor.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'dblclick':
        this._evtDblClick(event as MouseEvent);
        break;
      default:
          break;
    }
  }

  /**
   * Handles the double-click event for the ProseMirror editor.
   * 
   * Prevents the default action of showing the editor.
   * 
   * @param event - The DOM event sent to the widget.
   */
  private _evtDblClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
      super.onAfterAttach(msg);
      let node = this.node;
      node.addEventListener('dblclick', this);
  }
}

