import { Transaction, Selection } from "prosemirror-state";
import { Mark } from "prosemirror-model";

export function getMarksForSelection(transaction: Transaction): Mark[] {
    let selection = transaction.selection;
    console.log(selection);
    console.log(selection.content().content);
    if (selection.to - selection.from > 0) { // Non-empty selection

        let leftNode = selection.content().content.firstChild;
        if (leftNode.isTextblock) {
            return leftNode.firstChild.marks;
        }

    }
    else if (selection.to === selection.from && selection.from !== 0) { // Empty selection not at the beginning of the document. 
        let doc = transaction.doc;
        let newSelection = new Selection(doc.resolve(selection.from - 1), doc.resolve(selection.from));
        let leftNode = newSelection.content().content.firstChild;
        if (leftNode.isTextblock) {
            return leftNode.firstChild.marks;
        }
    }
    return [];
}