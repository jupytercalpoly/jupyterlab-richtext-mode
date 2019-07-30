import { Transaction,

} from "prosemirror-state";
import { Mark } from "prosemirror-model";

/**
 * Obtains the marks for the currently active selection.
 * 
 * On a non-empty selection, obtains the marks for the most left node of the selection.
 * On an empty selection, obtains the marks for the closest previous non-empty node.
 * 
 * @param transaction - The state transaction generated upon interaction with the editor.
 * @returns - An array of marks.
 */
export function getMarksForSelection(transaction: Transaction): Mark[] {
    let selection = transaction.selection;
    console.log(selection);
    console.log(selection.content().content);
    // console.log(transaction.doc.resolve(selection.from - 1));
    console.log(transaction.selection.$from.nodeBefore);

    if (selection.to - selection.from > 0) { // Non-empty selection

        let leftNode = selection.content().content.firstChild;
        console.log(leftNode);

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

    else if (selection.to === selection.from && selection.from !== 0) { // Empty selection not at the beginning of the document. 
        return getNodeBefore(transaction);
    }
    return [];
}

/**
 * Obtains the marks for the closest previous non-empty node.
 * 
 * @param transaction - The state transaction generated upon interaction with the editor.
 * @returns - An array of marks.
 */
function getNodeBefore(transaction: Transaction) {
    let doc = transaction.doc;
    let selection = transaction.selection;
    let prev = 0;
    let node = doc.resolve(selection.from).nodeBefore;

    while (!node || (node ? (node.textContent === "") : !node)) {
        prev++ ;
        node = doc.resolve(selection.from - prev).nodeBefore;
        console.log(node);
    }
    if (node.isTextblock) {
        console.log(node.lastChild);
        return node.lastChild.marks;
    }
    if (node.isText) {
        return node.marks;
    }    
}