import React from 'react';


/**
 * A React component for the rich text menu's individual items/marks.
 */
export default class MenuItem extends React.Component<{format: string, active: boolean, handleClick: (e: React.SyntheticEvent) => void}> {

    constructor(props: any) {
        super(props);
        this.getImgSrc = this.getImgSrc.bind(this);
    }

    /**
     * Gets the icon to be loaded based on the 'format' prop.
     * @returns - Hardcoded 'require' statements because 'require'
     * doesn't allow variables.
     */
    getImgSrc() {
        switch (this.props.format) {
            case "strong":
                return require("../static/scribe-format-strong.svg");
            case "em":
                return require("../static/scribe-format-em.svg");
            case "underline":
                return require("../static/scribe-format-underline.svg");
            case "code":
                return require("../static/scribe-format-code.svg");
            case "strikethrough":
                return require("../static/scribe-format-strikethrough.svg");
            default:
                break;
        }
    }

    /**
     * Renders the menu item component.
     */
    render() {
        return (
                <img 
                src={this.getImgSrc()} 
                alt="formatting" 
                id={this.props.format} 
                className={this.props.active ? "activeMenuItem" : "menuItem"}
                onClick={this.props.handleClick} />
        )
    }

}