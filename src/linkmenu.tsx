import React from 'react';
import MenuHeader from "./menuheader";

export class LinkMenu extends React.Component<{initialText: string, 
                                            initialLink: string, 
                                            cancel: (e: React.SyntheticEvent) => void, 
                                            submitLink: (initialText: string, initialLink: string, text: string, link: string) => void,
                                            deleteLink: (e: React.SyntheticEvent, link: string) => void
                                            returnToExperimental: (e: React.SyntheticEvent) => void}, 
                                            
                                            {textValue: string, linkValue: string}> {
    
    constructor(props: any) {
        super(props);
        this.state = {
            textValue: this.props.initialText,
            linkValue: this.props.initialLink
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleChange(e: React.SyntheticEvent) {
        let target = (e.target as HTMLInputElement);
        if (target.name === "text") {
            this.setState({textValue: target.value});
        }
        if (target.name === "link") {
            this.setState({linkValue: target.value});
        }

    }


    handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        // this.props.submitLink.bind(this);
        if (this.state.linkValue && this.state.textValue) {
            this.props.submitLink(this.props.initialText, this.props.initialLink, this.state.textValue, this.state.linkValue);
        }
    }

    handleClick(e: React.SyntheticEvent) {
        if (this.props.initialLink && this.props.initialLink === this.state.linkValue) {
            this.props.deleteLink(e, this.props.initialLink);
        }
    }
    render() {
       
            return (
                <div className="editor-menu">
                    <MenuHeader 
                    name="link"
                    canClick={true}
                    handleClick={this.props.returnToExperimental}
                    />
                    <form onSubmit={this.handleSubmit} className="jp-scribe-menu-content">
                        <div>
                            <label className="editor-menuLabel" style={{display: "block", marginBottom: "5px"}}>
                                Text
                                <input 
                                type="text" 
                                name="text" 
                                id="text" 
                                value={this.state.textValue} 
                                onChange={this.handleChange}
                                style={{marginLeft: "3px"}}
                                />
                            </label>

                            <div
                            style={{display: "flex"}}
                            >
                                <label 
                                className="editor-menuLabel"
                                style={{display: "inline-block"}}>
                                    Link
                                    <input 
                                    type="text" 
                                    name="link" 
                                    id="link" 
                                    value={this.state.linkValue} 
                                    onChange={this.handleChange}
                                    style={{marginLeft: "7px"}} />
                                </label>  
                                <img 
                                className="link-hover"
                                src={require("../static/scribe-format-link-off.png").default} 
                                style={{height: "18px", width: "18px", marginLeft: "7px"}}
                                onClick={this.handleClick}
                                alt=""/>
                            </div>
                        </div>

                        <div className="linkButtons">
                            <button className="jp-scribe-menu-cancel jp-mod-styled" type="button" onClick={this.props.cancel}>CANCEL</button>
                            <button type="submit" className="jp-scribe-menu-apply jp-mod-styled">APPLY</button> 
                        </div>               
    
                    </form>
                </div>
            );


    }
}

