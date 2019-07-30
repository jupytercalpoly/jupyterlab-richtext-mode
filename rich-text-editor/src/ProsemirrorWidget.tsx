import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {
    Widget,
    PanelLayout
} from "@phosphor/widgets";
import {keymap} from "prosemirror-keymap"
import {baseKeymap} from "prosemirror-commands"
import * as Markdown from "prosemirror-markdown"
import { MarkdownCell, MarkdownCellModel } from '@jupyterlab/cells';
import {
    Message
} from '@phosphor/messaging';
import {
    ReactWidget
} from '@jupyterlab/apputils';
import RichTextMenu from './RichTextMenu';
import React from 'react';
//@ts-ignore
import {exampleSetup} from "prosemirror-example-setup"
// import { Schema } from "prosemirror-model";
// import { schema } from "./prosemirro
// import * as scripts from "./prosemirror-scripts"

// import { INotebookTracker } from "@jupyterlab/notebook";
import { schema } from './prosemirror/prosemirror-schema';
import markdownit from "markdown-it/lib";
import { Fragment, Mark } from "prosemirror-model";
// import { schema } from 'prosemirror-schema-basic';





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

    // /**
    //  * The schema of the ProseMirror editor.
    //  */
    // private _schema: Schema;

    /**
     * The menu widget.
     * 
     */
    private _menu: Widget;

    /**
     *  Creates a Prosemirror text editor and attaches it to the widget's node. 
     * @param cell Should replace with an IOption object at some point, but takes in Markdown cell for updating.
     * 
     */
    constructor(cell: MarkdownCell) {
        super();

        this.addClass("editor");

        this._cell = cell;
        this._model = (cell.model as MarkdownCellModel);

        let source = this._model.toJSON().source;
        this._wrapper = document.createElement("div");
        console.log(source);

        let parser =  new Markdown.MarkdownParser(schema, markdownit("commonmark", {html: false}), {
            blockquote: {block: "blockquote"},
            paragraph: {block: "paragraph"},
            list_item: {block: "list_item"},
            bullet_list: {block: "bullet_list"},
            ordered_list: {block: "ordered_list", getAttrs: (tok: any) => ({order: +tok.attrGet("order") || 1})},
            heading: {block: "heading", getAttrs: (tok: any) => ({level: +tok.tag.slice(1)})},
            code_block: {block: "code_block"},
            fence: {block: "code_block", getAttrs: (tok: any) => ({params: tok.info || ""})},
            hr: {node: "horizontal_rule"},
            image: {node: "image", getAttrs: (tok: any) => ({
              src: tok.attrGet("src"),
              title: tok.attrGet("title") || null,
              alt: tok.children[0] && tok.children[0].content || null
            })},
            hardbreak: {node: "hard_break"},
          
            em: {mark: "em"},
            strong: {mark: "strong"},
            link: {mark: "link", getAttrs: (tok: any) => ({
              href: tok.attrGet("href"),
              title: tok.attrGet("title") || null
            })},        
            code_inline: {mark: "code"},

            strikethrough: {mark: "strikethrough"}
        });
        
        this._view = new EditorView(this._wrapper, {
        state: EditorState.create({
            doc: parser.parse(
                typeof source === "string" ? source : source.join('')
            ),
            plugins: [
                keymap(baseKeymap)
            ]
        })
        });

        this.node.appendChild(this._wrapper);

        // Get cell header
        const cellHeader = (this._cell.layout as PanelLayout).widgets[0].node;
        this._menu = ReactWidget.create(<RichTextMenu view={this._view} />);
        cellHeader.classList.add("header");

        Widget.attach(this._menu, cellHeader);

        this._model.contentChanged.connect(() => {
            this._cell.update();
        }) 
    
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
        console.log(this._view.state.doc);
        let serializer = new Markdown.MarkdownSerializer({
            blockquote(state, node) {
              state.wrapBlock("> ", null, node, () => state.renderContent(node))
            },
            code_block(state, node) {
              state.write("```" + (node.attrs.params || "") + "\n")
              state.text(node.textContent, false)
              state.ensureNewLine()
              state.write("```")
              state.closeBlock(node)
            },
            heading(state, node) {
              state.write(state.repeat("#", node.attrs.level) + " ")
              state.renderInline(node)
              state.closeBlock(node)
            },
            horizontal_rule(state, node) {
              state.write(node.attrs.markup || "---")
              state.closeBlock(node)
            },
            bullet_list(state, node) {
              state.renderList(node, "  ", () => (node.attrs.bullet || "*") + " ")
            },
            ordered_list(state, node) {
              let start = node.attrs.order || 1
              let maxW = String(start + node.childCount - 1).length
              let space = state.repeat(" ", maxW + 2)
              state.renderList(node, space, i => {
                let nStr = String(start + i)
                return state.repeat(" ", maxW - nStr.length) + nStr + ". "
              })
            },
            list_item(state, node) {
              state.renderContent(node)
            },
            paragraph(state, node) {
              state.renderInline(node)
              state.closeBlock(node)
            },
          
            image(state, node) {
              state.write("![" + state.esc(node.attrs.alt || "") + "](" + state.esc(node.attrs.src) +
              //@ts-ignore
                          (node.attrs.title ? " " + state.quote(node.attrs.title) : "") + ")")
            },
            hard_break(state, node, parent, index) {
              for (let i = index + 1; i < parent.childCount; i++)
                if (parent.child(i).type != node.type) {
                  state.write("\\\n")
                  return
                }
            },
            text(state, node) {
              state.text(node.text)
            }
          }, {
            em: {open: "*", close: "*", mixable: true, expelEnclosingWhitespace: true},
            strong: {open: "**", close: "**", mixable: true, expelEnclosingWhitespace: true},
            link: {
              open(_state: Markdown.MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
                return isPlainURL(mark, parent, index, 1) ? "<" : "["
              },
              close(_state: Markdown.MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
                  
                return isPlainURL(mark, parent, index, -1) ? ">"
                //@ts-ignore
                  : "](" + _state.esc(mark.attrs.href) + (mark.attrs.title ? " " + _state.quote(mark.attrs.title) : "") + ")"
              }
            },
            code: {open(_state: Markdown.MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) { return backticksFor(parent.child(index), -1) },
                   close(_state: Markdown.MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) { return backticksFor(parent.child(index - 1), 1) },
                   escape: false},
            strikethrough: {open: "~~", close: "~~", mixable: false, expelEnclosingWhitepsace: true}
          })

          //@ts-ignore
          function backticksFor(node, side) {
            let ticks = /`+/g, m, len = 0
            if (node.isText) while (m = ticks.exec(node.text)) len = Math.max(len, m[0].length)
            let result = len > 0 && side > 0 ? " `" : "`"
            for (let i = 0; i < len; i++) result += "`"
            if (len > 0 && side < 0) result += " "
            return result
          }
          
          //@ts-ignore
          function isPlainURL(link, parent, index, side) {
            if (link.attrs.title) return false
            let content = parent.child(index + (side < 0 ? -1 : 0))
            if (!content.isText || content.text != link.attrs.href || content.marks[content.marks.length - 1] != link) return false
            if (index == (side < 0 ? 1 : parent.childCount - 1)) return true
            let next = parent.child(index + (side < 0 ? -2 : 1))
            return !link.isInSet(next.marks)
          }
        const source = serializer.serialize(
            this._view.state.doc
          );
          console.log(source);

        if (source.trim() === this._model.value.text.trim()) { // If no text change, force render. 
            this._cell.update();
            return ;
        }

        Widget.detach(this._menu);

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
   * Prevents the default action of showing the default editor. 
   * 
   * @param event - The DOM event sent to the widget.
   */
  private _evtDblClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   * 
   * Attaches a 'dblclick' event listener onto this widget's node. 
   */
  protected onAfterAttach(msg: Message): void {
      super.onAfterAttach(msg);
      let node = this.node;

      node.addEventListener('dblclick', this);
  }
}

