import { NotebookPanel, 
    StaticNotebook
} from "@jupyterlab/notebook";
import { Cell, 
    MarkdownCell
 } from "@jupyterlab/cells";

export default class ContentFactoryEditor extends NotebookPanel.ContentFactory {
    constructor(options?: Cell.ContentFactory.IOptions | undefined) {
        super(options);
        console.log(this.editorFactory);
        
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
          console.log(options.contentFactory);
        if (!options.contentFactory) {
            options.contentFactory = this;
        }
        
        return new MarkdownCell(options).initializeState();
      }
}