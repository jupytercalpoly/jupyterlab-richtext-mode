import React from 'react';

export default class HeadingMenuItem extends React.Component<{level: number, activeLevel: number, handleClick: (e: React.SyntheticEvent) => void}, {}> {

    constructor(props: any) {
        super(props);
        this.getLevelText = this.getLevelText.bind(this);
    }

    getLevelText() {
        switch (this.props.level) {
            case 0:
                return "Normal";
            case 1:
                return "Title";
            case 2:
                return "Subtitle";
            case 3: 
                return "Heading 1";
            case 4: 
                return "Heading 2";
            case 5:
                return "Heading 3";
            case 6:
                return "Caption";
        }
    }
    render() {
        if (this.props.activeLevel === this.props.level) {
            return (
                <div style={{display: "flex", borderBottom: "1px solid var(--jp-border-color2)"}}>
                    <div style={{display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: "10px"}}>
                        <img 
                        src={require("../static/scribe-check.png")} 
                        style={{height: "18px", width: "18px"}}
                        alt=""/>
                    </div>
                    <p 
                    id={`heading${this.props.level}`} 
                    className={`jp-scribe-menu-heading${this.props.level}`} 
                    style={{padding: "10px 7px"}}
                    >{this.getLevelText()}</p>
                    
                </div>
            )
        }
        else {
            return (
                <div className="jp-scribe-heading-menu">
                    <p 
                    id={`heading${this.props.level}`} 
                    className={`jp-scribe-menu-heading${this.props.level}`} 
                    style={{padding: "10px 35px", borderBottom: "1px solid var(--jp-border-color2)"}}
                    onClick={this.props.handleClick}>{this.getLevelText()}</p>
                    
                </div>
            )
        }

    }
}