import { Transaction, EditorState,
Selection,
TextSelection,
// NodeSelection,

} from "prosemirror-state";
import { Mark, MarkType, ResolvedPos, Node, Schema } from "prosemirror-model";
import { schema } from "./prosemirror-schema";
import { EditorView } from "prosemirror-view";

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
    // console.log(selection.from);

    if (!selection.empty) { // Non-empty selection

        let leftNode = selection.content().content.firstChild;
        // console.log(leftNode);

        if (leftNode.isTextblock) {
            if (leftNode.textContent === "") {
                // return getNodeBefore(transaction);
                return [];
            }
            else {
                return leftNode.firstChild.marks;
            }
        }
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
    console.log(mark);
    function canAddMark(from: ResolvedPos, to: ResolvedPos, doc: Node) {

        if (from.marksAcross(to).includes(mark)) {
            for (let i = from.pos + 1; i < to.pos + 1; i++) {
                if (doc.resolve(i).parent.type.isTextblock && 
                !doc.resolve(i).marks().includes(mark) &&
                doc.resolve(i).parent.textContent) {

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
                if ((state.storedMarks || marks) && (marks ? marks.includes(mark) : false || (state.storedMarks ? state.storedMarks.includes(mark) : false))) {
                    console.log(`removing stored mark ${mark}`);
                    dispatch(state.tr.removeStoredMark(mark));
                }
                else {
                    console.log(`adding stored mark ${mark}`);
                    dispatch(state.tr.addStoredMark(mark));
                }
            }
    
            else {
                let selection = state.selection;
                // console.log(selection);
                if (canAddMark(selection.$from, selection.$to, state.doc)) {
                    console.log(`adding mark ${mark}`);
                    dispatch(state.tr.addMark(selection.from, selection.to, mark).scrollIntoView());
                }
                else {
                    console.log(`removing mark ${mark}`);
                    dispatch(state.tr.removeMark(selection.from, selection.to, mark).scrollIntoView());
                }
            }
        }



        return true;
    }
}

function getSelectionText(selection: Selection, doc: Node) {
    let { $from } = selection;
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
        return {text: "", link: ""};
    }

}

export function getTextForSelection(selection: Selection, view: EditorView) {
    let { empty, from, to, $from } = selection;
    let doc = view.state.doc;
    if (empty) {

        let linkMenuFields = getSelectionText(selection, doc);
        if (linkMenuFields.text !== "") {           
            let offset = $from.textOffset;
            let length = $from.node().child($from.index(1)).nodeSize;
            console.log(offset);
            let newSelection = new TextSelection(doc.resolve($from.pos - offset), doc.resolve($from.pos + (length - offset)));

            view.dispatch(view.state.tr.setSelection(newSelection));
            console.log(view.state.selection);
            
        }
        return linkMenuFields;
    }
    else {
        let node = doc.cut(from, to);
        let linkField: string;
        let markTypes = node.marks.map( (mark) => { return mark.type })
        if (markTypes.includes(schema.marks.link)) {
            linkField = node.marks.find((mark) => {
                return mark.type.name === "link";
            }).attrs.href;
        }
        else {
            linkField = "";
        }
        return {text: node.textContent, link: linkField};
    }

}

export function buildKeymap(schema: Schema) {


    let keys: KeyObject = {};
    
    keys["Mod-b"] = toggleMark(schema.marks.strong);
    keys["Mod-B"] = toggleMark(schema.marks.strong);
    keys["Mod-i"] = toggleMark(schema.marks.em);
    keys["Mod-I"] = toggleMark(schema.marks.em);
    return keys;
}

interface KeyObject {
    [key: string]: (state: EditorState, dispatch: (tr: Transaction) => void) => boolean;
}
