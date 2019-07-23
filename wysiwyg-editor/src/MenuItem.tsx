import React from 'react';


export default class MenuItem extends React.Component<{format: string, active: boolean, handleClick: (e: React.SyntheticEvent) => void}> {

    constructor(props: any) {
        super(props);
        this.getImgSrc = this.getImgSrc.bind(this);
    }

    getImgSrc() {
        let format = this.props.format;
        switch (format) {
            case "strong":
                return require("../static/scribe-format-strong.svg");
            case "em":
                return require("../static/scribe-format-em.svg");
            default:
                break;
        }
    }
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