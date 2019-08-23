import { Transaction, EditorState,
Selection,
TextSelection,
// NodeSelection,

} from "prosemirror-state";
import { Mark, MarkType, 
    ResolvedPos,
    Node, Schema } from "prosemirror-model";
import { schema } from "./prosemirror-schema";
import { EditorView } from "prosemirror-view";
import { splitListItem, wrapInList } from "prosemirror-schema-list";
import { chainCommands, } from "prosemirror-commands"; 

/**
 * Obtains the marks for the currently active selection.
 * 
 * On a non-empty selection, obtains the marks for the most left node of the selection.
 * On an empty selection, obtains the marks for the closest previous non-empty node.
 * 
 * @param transaction - The state transaction generated upon interaction with the editor.
 * @returns - An array of marks.
 */
export function getMarksForSelection(transaction: Transaction, state: EditorState): Mark[] {
    let selection = transaction.selection;
    // let doc = transaction.doc;
    // console.log(selection.from);
    if (!selection.empty) { // Non-empty selection
        // console.log(selection);
        // console.log(selection.content());
        // console.log(selection.$from.marks());
        // let leftNode = doc.cut(selection.from, selection.to);
        // console.log(leftNode);

        
        // // if (leftNode.isTextblock) {
        // //     if (leftNode.textContent === "") {
        // //         // return getNodeBefore(transaction);
        // //         return [];
        // //     }
        // //     else {
        // //         console.log(leftNode.firstChild);
        // //         return leftNode.firstChild.marks;
        // //     }
        // // }
        // if (!leftNode.textContent) {
        //     return [];
        // }
        // else {
        //     return leftNode.firstChild.marks;
        // }
        return selection.$from.marks();
    }

    else if (selection.from != 1) { // Empty selection 
        // console.log(state.storedMarks);
        // console.log(selection.$from.marks());
        return getMarksBefore(state);
    }
    return [];
}

/**
 * Obtains the marks for the closest previous non-empty node.
 * 
 * @param transaction - The state transaction generated upon interaction with the editor.
 * @returns - An array of marks.
 */

function getMarksBefore(state: EditorState) {
    let doc = state.doc;
    let selection = state.selection;
    // console.log(selection.from);
    if (state.selection.from == 1) {
        return null;
    }
    let from = doc.resolve(selection.from - 1);
    let prev = 1;
    // console.log(from.marksAcross(selection.$to));
    while (!from.marksAcross(selection.$to)) {
        if (from.pos === 0) {
            return [];
        }
        prev++;
        from = doc.resolve(selection.from - prev);
    }

    return from.marksAcross(selection.$to);
//     let prev = 0;
//     let node = doc.resolve(selection.from).nodeBefore;

//     while (!node || (node ? (node.textContent === "") : !node)) {
//         prev++ ;
//         node = doc.resolve(selection.from - prev).nodeBefore;
//         // console.log(node);
//     }
//     if (node.isTextblock) {
//         // console.log(node.lastChild);
//         return node.lastChild.marks;
//     }
//     if (node.isText) {
//         return node.marks;
//     }    
// }
};

/**
 * Toggles the given mark.
 */
export function toggleMark(markType: MarkType, attrs?: Object) {


    let mark = markType.create(attrs);
    // console.log(mark);
    function canAddMark(from: ResolvedPos, to: ResolvedPos, doc: Node) {

        if (from.marksAcross(to).includes(mark)) {
            for (let i = from.pos + 1; i < to.pos + 1; i++) {
                let pos = doc.resolve(i);
                if (pos.parent.type.isTextblock && 
                !pos.marks().includes(mark) &&
                pos.parent.textContent) {

                    return true;
                }
            }
            return false;
        } else {
            return true;
        }
    }

        
    return (state: EditorState, dispatch: (tr: Transaction) => void) => {
        // If the selection is empty, toggle in storedMarks.
        // TODO: Check to see if marks are even allowed to be added!
        if (dispatch) {
            if (state.selection.empty) {
                let marks = getMarksBefore(state);
                console.log(marks);
                console.log(state.storedMarks);
                if ((state.storedMarks || marks) && ((marks ? marks.includes(mark) : false) || (state.storedMarks ? state.storedMarks.includes(mark) : false))) {
                    console.log(`removing stored mark ${mark}`);
                    dispatch(state.tr.removeStoredMark(mark));
                }
                else {
                    console.log(`adding stored mark ${mark}`);
                    dispatch(state.tr.addStoredMark(mark));
                }
            }
    
            else {
                let {ranges} = state.selection;
                for (let i = 0; i < ranges.length; i++) {
                    let {$from, $to} = ranges[i];
                    if (canAddMark($from, $to, state.doc)) {
                        console.log(`adding mark ${mark}`);
                        dispatch(state.tr.addMark($from.pos, $to.pos, mark).scrollIntoView());
                    }
                    else {
                        console.log(`removing mark ${mark}`);
                        dispatch(state.tr.removeMark($from.pos, $to.pos, mark).scrollIntoView());
                    }
                }
                // console.log(selection);
                // if (canAddMark($from, $to, state.doc)) {
                //     console.log(`adding mark ${mark}`);
                //     dispatch(state.tr.addMark(from, to, mark).scrollIntoView());
                // }
                // else {
                //     console.log(`removing mark ${mark}`);
                //     dispatch(state.tr.removeMark(from, to, mark).scrollIntoView());
                // }
            }
        }



        return true;
    }
}

function getSelectionText(selection: Selection, doc: Node) {
    let { $from, from, to } = selection;
    console.log($from.index($from.depth));
    console.log($from.node());
    if ($from.node().childCount - 1 < $from.index(1)) { // Interesting case where, at the end of a paragraph, the child is at an index that hasn't been created.
        return {text: "", link: ""}
    };
    let node = $from.node().child($from.index($from.depth));
    let markTypes = node.marks.map( (mark) => { return mark.type })
    if (markTypes.includes(schema.marks.link)) {
        return {text: node.textContent, link: node.marks.find((mark) => {
            return mark.type.name === "link";
        }).attrs.href};
    }
    else {
        return {text: doc.cut(from, to).textContent, link: ""};
    }

}

export function getTextForSelection(selection: Selection, view: EditorView) {
    let { $from } = selection;
    let doc = view.state.doc;
 

        let linkMenuFields = getSelectionText(selection, doc);
        if (linkMenuFields.text && linkMenuFields.link) {           
            let offset = $from.textOffset;
            let length = $from.node().child($from.index($from.depth)).nodeSize;
            console.log(offset);
            let newSelection = new TextSelection(doc.resolve($from.pos - offset), doc.resolve($from.pos + (length - offset)));

            view.dispatch(view.state.tr.setSelection(newSelection));
            console.log(view.state.selection);
            
        }
        return linkMenuFields;
    
 
        // let node = doc.cut(from, to);
        // let linkField: string;
        // let markTypes = node.marks.map( (mark) => { return mark.type })
        // if (markTypes.includes(schema.marks.link)) {
        //     linkField = node.marks.find((mark) => {
        //         return mark.type.name === "link";
        //     }).attrs.href;
        // }
        // else {
        //     linkField = "";
        // }
        // return {text: node.textContent, link: linkField};


}

export function getHeadingLevel(selection: Selection) {
    let { $from } = selection;
    if ($from.node().type.name === "heading") {
        return $from.node().attrs.level;
    }
    else if ($from.node().type.name === "paragraph") { // Paragraph is normal text.
        return 0;
    }
}

export function newlineInMath(state: EditorState, dispatch: (tr: Transaction) => void) {
    let {$head, $anchor} = state.selection;
    let marks = $head.marks().map(mark => mark.type.name);
    if (!(marks.includes("math") || marks.includes("block_math") || !($head.sameParent($anchor))) || !($head.node().type.name === "paragraph")) return false;
    // console.log($head.node()); 

    let offset = $head.parentOffset;
    // let childIndex = $head.index($head.depth);
    // console.log(childIndex);
    // let textNode;

    // if ($head.node().childCount - 1 < childIndex) {
    //     textNode = $head.node().child(childIndex - 1);
    // }
    // else {
    //     textNode = $head.node().child(childIndex);
    // }
    // console.log(textNode);

    // let text = textNode.text[$head.textOffset];
    // console.log(text);

    if (offset > 0 ? ($head.node().textBetween(offset - 1, offset) === "$") : ($head.node().textBetween(offset, offset) === "$")) return false;
    // if (dispatch) dispatch(state.tr.insertText("\n").scrollIntoView());
    if (dispatch) dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView());
    return true;
}

export function renderMath(state: EditorState, dispatch: (tr: Transaction) => void) {
    // console.log("render math!");
    let {$head, $anchor} = state.selection;
    let marks = $head.marks().map(mark => mark.type.name);
    let parent = $head.parent;
    if (!(marks.includes("math")) || !($head.sameParent($anchor)) || !($head.node().type.name === "paragraph")) return false;
    let childIndex = $head.index($head.depth);

    let textNode;
    let currentIndex;
    if ($head.node().childCount - 1 < childIndex) {
        
        currentIndex = childIndex - 1;
    }
    else {
        currentIndex = childIndex;
    }

    textNode = parent.child(currentIndex);
    if (!textNode.marks.includes(schema.marks.math.create())) {
        currentIndex = childIndex - 1;
    }
    textNode = parent.child(currentIndex);
    console.log("rendering");
    console.log(textNode);
    let tr = state.tr;
    let fromPos = tr.selection.from;
    let mathText = "";
    for (let i = currentIndex; i >= 0; i--) {
        let child = parent.child(i);
        if (child.marks.includes(schema.marks.math.create())) {
            fromPos -= child.nodeSize;
            if (child.type.name !== "hard_break") {
                mathText = child.text + mathText;
            }
        }
        else {
            break;
        }
    }
    
    tr = tr.setSelection(TextSelection.create(tr.doc, fromPos, tr.selection.from))
            .removeMark(tr.selection.from, tr.selection.to, schema.marks.math);

    if (mathText.slice(0, 2) === "$$") {
        tr = tr.replaceSelectionWith(schema.nodes.block_math.create({texts: mathText}));
        if (!tr.selection.$head.nodeAfter) {
            tr = tr.insert(tr.selection.from + 1, schema.nodes.paragraph.create());
            tr = tr.setSelection(TextSelection.create(tr.doc, tr.selection.from + 1));
        }
    }
    else {
        tr = tr.replaceSelectionWith(schema.nodes.inline_math.create({texts: mathText}));
        
    }
    if (dispatch) dispatch(tr);
    return true;
}

export function buildKeymap(schema: Schema) {


    let keys: KeyObject = {};
    
    keys["Mod-b"] = toggleMark(schema.marks.strong);
    keys["Mod-B"] = toggleMark(schema.marks.strong);
    keys["Mod-i"] = toggleMark(schema.marks.em);
    keys["Mod-I"] = toggleMark(schema.marks.em);
    keys["Mod-U"] = toggleMark(schema.marks.underline);
    keys["Mod-u"] = toggleMark(schema.marks.underline);
    keys["Mod-K"] = toggleMark(schema.marks.strikethrough);
    keys["Mod-Shift-8"] = wrapInList(schema.nodes.bullet_list);
    keys["Mod-Shift-9"] = wrapInList(schema.nodes.ordered_list);
    keys["Enter"] = chainCommands(newlineInMath, renderMath, splitListItem(schema.nodes.list_item));
    keys["ArrowLeft"] = arrowHandler("left");
    keys["ArrowRight"] = arrowHandler("right");
    keys["ArrowUp"] = arrowHandler("up");
    keys["ArrowDown"] = arrowHandler("down");
    return keys;
}
function arrowHandler(dir: any) {
    return (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
        console.log(`arrow key ${dir} pressed!`);
      if (state.selection.empty && view.endOfTextblock(dir)) {
          console.log("this is at the end of a textblock");
        let side = dir == "left" || dir == "up" ? -1 : 1, $head = state.selection.$head
        let nextPos = Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side)
        if (nextPos.$head && nextPos.$head.parent.type.name == "code_block") {
          dispatch(state.tr.setSelection(nextPos))
          return true
        }
      }
      return false
    }
  }
  

// export function descendantOf(node: Node, type: NodeType) {
    
// }
interface KeyObject {
    [key: string]: (state: EditorState, dispatch: (tr: Transaction) => void, view?: EditorView) => boolean;
}
