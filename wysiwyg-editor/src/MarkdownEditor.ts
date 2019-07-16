import {
    NotebookTools
} from '@jupyterlab/notebook';
import { Message } from '@phosphor/messaging';
import { MarkdownCell, MarkdownCellModel } from '@jupyterlab/cells';
import {
    JupyterFrontEnd
} from '@jupyterlab/application';
import ProseMirrorEditor from './ProsemirrorWidget';



class MarkdownEditorTool extends NotebookTools.Tool {

    readonly app: JupyterFrontEnd;
    constructor(app: JupyterFrontEnd) {
        super();
        this.app = app;
    }

    /**
     * Renders a Prosemirror text editor over any active Markdown cell. 
     */
    protected onActiveCellChanged(msg: Message): void {

        if (this.notebookTools.activeCell instanceof MarkdownCell) {
            console.log("The active cell is now markdown.");
            const markdownCell = this.notebookTools.activeCell;
            const widget = new ProseMirrorEditor(markdownCell.model as MarkdownCellModel);
            markdownCell.inputArea.renderInput(widget);
        }
    }

    /* Attempted to change cell header of markdown. */
    // protected onActiveCellChanged(msg: Message): void {
    //     // const isMarkdown = isMarkdownCellModel(this.notebookTools.activeCell.model);
    //     console.log("Active cell changed!");
    //     if (this.notebookTools.activeCell instanceof MarkdownCell) {
    //         console.log("The active cell is now markdown.");
    //         const header = document.createElement("h1");
    //         header.innerText = "On top of markdown";
    //         const layoutWidgets = (this.notebookTools.activeCell.layout as PanelLayout).widgets;
    //         const headerWidget = layoutWidgets[0]; // The layout for cell is header -> input -> footer. 
    //         // const inputAreaWidget = (layoutWidgets[1] as Panel).widgets[1]; // The input is a Panel object w/ 2 widgets: input collapser and input area. 
    //         if (headerWidget.node.children.length < 1 && this.notebookTools.activeCell.editor.hasFocus) {
    //             headerWidget.node.appendChild(header);
    //             headerWidget.addClass("header");
    //         }
    //         this.notebookTools.activeCell.model.stateChanged.connect((_, args) => {
    //             console.log(`State is now changed to ${args}`);
    //         })
    //         console.log(this.previousActive);
    //         if (this.previousActive instanceof MarkdownCell && this.previousActive !== this.notebookTools.activeCell) {
    //             console.log((this.previousActive.layout as PanelLayout).widgets[0].node);
    //             (this.previousActive.layout as PanelLayout).widgets[0].node.removeChild(this.previousElement);
    //         }

    //         this.previousActive = this.notebookTools.activeCell;
    //         this.previousElement = header;
    //         // this.notebookTools.activeCell.node.appendChild(header);
    //         // CellHeader.attach(headerWidget, this.notebookTools.activeCell.node);
    //         // console.log(headerWidget.isAttached);
    //         // console.log(headerWidget.isVisible);
    //     }
    // }
}

export default MarkdownEditorTool;