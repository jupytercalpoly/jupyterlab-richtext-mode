import { Transaction, EditorState,

} from "prosemirror-state";
import { Mark, MarkType, ResolvedPos, Node } from "prosemirror-model";

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
    console.log(selection.from);
    // console.log(selection);
    // console.log(selection.content().content);
    // console.log(transaction.doc.resolve(selection.from - 1));
    // console.log(transaction.selection.$from.nodeBefore);

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
        prev++;
        from = doc.resolve(selection.from - prev);
        // console.log(from.marksAcross(selection.$to));
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
export function toggleMark(markType: MarkType) {

    let mark = markType.create();
    
    function canAddMark(from: ResolvedPos, to: ResolvedPos, doc: Node) {

        if (from.marksAcross(to).includes(mark)) {
            for (let i = from.pos + 1; i < to.pos + 1; i++) {
                if (doc.resolve(i).parent.type.isTextblock && 
                !doc.resolve(i).marks().includes(mark)) {

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

        if (dispatch) {
            if (state.selection.empty) {
                let marks = getMarksBefore(state);
                if (marks && marks.includes(mark)) {
                    dispatch(state.tr.removeStoredMark(mark));
                }
                else {
                    console.log("adding stored mark");
                    dispatch(state.tr.addStoredMark(mark));
                }
            }
    
            else {
                let selection = state.selection;
                // console.log(selection);
                if (canAddMark(selection.$from, selection.$to, state.doc)) {
                    console.log("adding mark");
                    dispatch(state.tr.addMark(selection.from, selection.to, mark).scrollIntoView());
                }
                else {
                    console.log("removing mark");
                    dispatch(state.tr.removeMark(selection.from, selection.to, mark).scrollIntoView());
                }
            }
        }



        return true;
    }
}