import CodeMirror from "codemirror"
import {exitCode} from "prosemirror-commands"
import {undo, redo} from "prosemirror-history"
import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { TextSelection, Selection } from "prosemirror-state";
import "../../node_modules/codemirror/mode/javascript/javascript";
import "../../node_modules/codemirror/mode/python/python";
import "../../node_modules/codemirror/addon/display/autorefresh";
export class CodeBlockView {

  private node: Node;
  private view: EditorView;
  private getPos: () => number;
  private incomingChanges: boolean;
  private cm: CodeMirror.Editor;
  public dom: HTMLElement;
  private updating: boolean;
  private doc: CodeMirror.Doc;
  constructor(node: Node, view: EditorView, getPos: () => number) {
    // Store for later
    this.node = node
    this.view = view
    this.getPos = getPos
    this.incomingChanges = false
    console.log(this.view);
    console.log(this.getPos);
    console.log(this.incomingChanges);
    // Create a CodeMirror instance
    this.cm = CodeMirror(null, {
      value: this.node.textContent,
      theme: "jupyter",
      mode: node.attrs.params,
      //@ts-ignore
      autoRefresh: {delay: 0},
      extraKeys: this.codeMirrorKeymap(),
      
    })
    this.doc = this.cm.getDoc();

    // The editor's outer node is our DOM representation
    this.dom = this.cm.getWrapperElement();
    console.log(this.dom);
    // CodeMirror needs to be in the DOM to properly initialize, so
    // schedule it to update itself
    setTimeout(() => this.cm.refresh(), 20)
  
    // This flag is used to avoid an update loop between the outer and
    // inner editor
    this.updating = false
    // Track whether changes are have been made but not yet propagated
    this.cm.on("beforeChange", () => {console.log("change made!"); this.incomingChanges = true});
    // Propagate updates from the code editor to ProseMirror
    this.cm.on("cursorActivity", () => {
        console.log(this.doc.getSelection());
      if (!this.updating && !this.incomingChanges) this.forwardSelection()
    })
    this.cm.on("changes", () => {
      if (!this.updating) {
        this.valueChanged()
        this.forwardSelection()
      }
      this.incomingChanges = false
    })
    this.cm.on("focus", () => this.forwardSelection())
  }

  forwardSelection() {
    if (!this.cm.hasFocus()) return
    let state = this.view.state
    let selection = this.asProseMirrorSelection(state.doc)
    if (!selection.eq(state.selection))
      this.view.dispatch(state.tr.setSelection(selection))
  }

  asProseMirrorSelection(doc: Node) {
    let offset = this.getPos() + 1
    let anchor = this.doc.indexFromPos(this.doc.getCursor("anchor")) + offset
    let head = this.doc.indexFromPos(this.doc.getCursor("head")) + offset
    return TextSelection.create(doc, anchor, head)
  }

  setSelection(anchor: number, head: number) {
    this.cm.focus()
    this.updating = true
    this.doc.setSelection(this.doc.posFromIndex(anchor),
                         this.doc.posFromIndex(head))
    this.updating = false
  }

  valueChanged() {
    let change = computeChange(this.node.textContent, this.cm.getValue())
    if (change) {
      let start = this.getPos() + 1
      let tr = this.view.state.tr.replaceWith(
        start + change.from, start + change.to,
        change.text ? this.view.state.schema.text(change.text) : null)
      this.view.dispatch(tr)
    }
  }

  codeMirrorKeymap() {
    let view = this.view

    let mod = /Mac/.test(navigator.platform) ? "Cmd" : "Ctrl"
    //@ts-ignore
    return CodeMirror.normalizeKeyMap({
      Up: () => this.maybeEscape("line", -1),
      Left: () => this.maybeEscape("char", -1),
      Down: () => this.maybeEscape("line", 1),
      Right: () => this.maybeEscape("char", 1),
      [`${mod}-Z`]: () => undo(view.state, view.dispatch),
      [`Shift-${mod}-Z`]: () => redo(view.state, view.dispatch),
      [`${mod}-Y`]: () => redo(view.state, view.dispatch),
      "Ctrl-Enter": () => {
        if (exitCode(view.state, view.dispatch)) view.focus()
      }
    })
  }

  maybeEscape(unit: any, dir: any) {
    let pos = this.doc.getCursor()
    console.log(pos);
    if (this.doc.somethingSelected() ||
        pos.line != (dir < 0 ? this.doc.firstLine() : this.doc.lastLine()) ||
        (unit == "char" &&
         pos.ch != (dir < 0 ? 0 : this.doc.getLine(pos.line).length)))
      return CodeMirror.Pass
    this.view.focus()
    let targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize)
    let selection = Selection.near(this.view.state.doc.resolve(targetPos), dir)
    this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView())
    this.view.focus()
  }

  update(node: Node) {
    if (node.type != this.node.type) return false
    this.node = node
    let change = computeChange(this.cm.getValue(), node.textContent)
    if (change) {
      this.updating = true
      this.doc.replaceRange(change.text, this.doc.posFromIndex(change.from),
                           this.doc.posFromIndex(change.to))
      this.updating = false
    }
    return true
  }

  selectNode() { this.cm.focus() }
  stopEvent() { return true }

}


function computeChange(oldVal: string, newVal: string) {
    if (oldVal == newVal) return null
    let start = 0, oldEnd = oldVal.length, newEnd = newVal.length
    while (start < oldEnd && oldVal.charCodeAt(start) == newVal.charCodeAt(start)) ++start
    while (oldEnd > start && newEnd > start &&
           oldVal.charCodeAt(oldEnd - 1) == newVal.charCodeAt(newEnd - 1)) { oldEnd--; newEnd-- }
    return {from: start, to: oldEnd, text: newVal.slice(start, newEnd)}
  }

