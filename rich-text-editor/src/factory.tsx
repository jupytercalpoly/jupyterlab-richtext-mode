import { NotebookPanel, 
    StaticNotebook
} from "@jupyterlab/notebook";
import { Cell, 
    MarkdownCell
 } from "@jupyterlab/cells";
 import { CodeEditor } from "@jupyterlab/codeeditor";
 import { ProseMirrorEditor } from "./prosemirror/ProseMirrorEditor";

export default class ContentFactoryEditor extends NotebookPanel.ContentFactory {
    constructor(options?: Cell.ContentFactory.IOptions | undefined) {
        super(options);
        
    }

    /**
     * Create a markdown cell with a ProseMirror editor instead of CodeMirror. 
     * @param options 
     * @param parent 
     */
    createMarkdownCell(
        options: MarkdownCell.IOptions,
        parent: StaticNotebook
      ): MarkdownCell {
        let proseMirrorEditor = (options: CodeEditor.IOptions) => {
            return new ProseMirrorEditor(options);
          }
        let newContentFactory = new ContentFactoryEditor({editorFactory: proseMirrorEditor})
        options.contentFactory = newContentFactory;
        console.log(options.contentFactory);
        
        return new MarkdownCell(options).initializeState();
      }
}