import React from 'react';
// import ReactDOM from 'react-dom';
// import { Widget } from '@phosphor/widgets';
// import { HoverBox } from "@jupyterlab/apputils";
/**
 * A React component for the rich text menu's individual items/marks.
 */
export default class MenuItem extends React.Component<{format: string, active: boolean, cancelled: boolean, separates: boolean, handleClick: (e: React.SyntheticEvent) => void}> {

    constructor(props: any) {
        super(props);
        this.getFormatMark = this.getFormatMark.bind(this);
        this.getClassName = this.getClassName.bind(this);
    }

    // componentDidMount() {
    //     if (this.props.menuWidget) { // If it needs to render a menu widget, set geometry for hoverbox. 
    //         let thisNode = (ReactDOM.findDOMNode(this.refs[this.props.format]) as HTMLElement);
    //         this.setGeometry = this.setGeometry.bind(this);
    //         this.setGeometry(thisNode);
    //     }
    // }

    /**
     * 
    //  */
    // setGeometry(componentNode: HTMLElement) {
    //     let widget = this.props.menuWidget;
    //     console.log("setting geometry");
    //     const style = window.getComputedStyle(widget.node);
    //     let rect = componentNode.getBoundingClientRect();
    //     console.log(rect);
    //     console.log(componentNode);
    //     HoverBox.setGeometry({
    //         anchor: rect,
    //         host: componentNode,
    //         minHeight: 50,
    //         maxHeight: 200,
    //         node:  widget.node,
    //         privilege: "below",
    //         style
    //     });

    //     // if (widget.isAttached) {
    //     //     Widget.detach(widget);
    //     // }
    //     // else {
    //     //     Widget.attach(widget, document.body);
    //     // }

    // }
    // /**
    //  * Gets the icon to be loaded based on the 'format' prop.
    //  * @returns - Hardcoded 'require' statements because 'require'
    //  * doesn't allow variables.
    //  */
    // getImgSrc() {
    //     switch (this.props.format) {
    //         case "strong":
    //             return require("../static/scribe-format-strong.svg");
    //         case "em":
    //             return require("../static/scribe-format-em.svg");
    //         case "underline":
    //             return require("../static/scribe-format-underline.svg");
    //         case "code":
    //             return require("../static/scribe-format-code.svg");
    //         case "strikethrough":
    //             return require("../static/scribe-format-strikethrough.svg");
    //         case "blockquote":
    //             return require("../static/scribe-format-blockquote.svg");
    //         default:
    //             break;
    //     }
    // }

    /**
     * Gets the name of the format in ProseMirror language.
     */
    getFormatMark() {
        switch (this.props.format) {
            case "format_bold":
                return "strong";
            case "format_italic":
                return "em";
            case "format_underline":
                return "underline";
            case "code":
                return "code";
            case "strikethrough_s":
                return "strikethrough";
            case "format_quote":
                return "blockquote";
            case "insert_link":
                return "link";
            case "photo":
                return "image";
            case "format_list_bulleted":
                return "bullet_list";
            case "format_list_numbered":
                return "ordered_list";
            case "text_fields":
                return "heading";
            default:
                break;
        }
    }

    getClassName() {
        let format = this.props.format;
        let active = this.props.active;
        let separates = this.props.separates;
        let str = "material-icons";

 
        if (format === "insert_link" || format === "photo") {
            str += " menuItem";
        }
        else if (active) {
            str += " activeMenuItem";
        }
        else {
            str += " menuItem";
        }

        if (separates) {
            str += " separatorItem";
        }

        return str;
    }
    /**
     * Renders the menu item component.
     */
    render() {
        if (this.props.cancelled) {
            return (
                <i 
                // src={this.getImgSrc()} 
                // alt="formatting" 
                id={this.getFormatMark()} 
                className="material-icons inactive-menu-icon"
                >{this.props.format}</i>               
            )
        }
        else {
            return (
                <i 
                // src={this.getImgSrc()} 
                // alt="formatting" 
                id={this.getFormatMark()} 
                className={this.getClassName()}
                onClick={this.props.handleClick}>{this.props.format}</i>
            )
        }

    }

}