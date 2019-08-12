import React from 'react';
import MenuHeader from "./menuheader";

export class LinkMenu extends React.Component<{initialText: string, 
                                            initialLink: string, 
                                            cancel: (e: React.SyntheticEvent) => void, 
                                            submitLink: (initialText: string, initialLink: string, text: string, link: string) => void}, 
                                            {textValue: string, linkValue: string}> {
    
    constructor(props: any) {
        super(props);
        this.state = {
            textValue: this.props.initialText,
            linkValue: this.props.initialLink
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
    render() {
       
            return (
                <div className="editor-menu">
                    <MenuHeader 
                    name="link"
                    canClick={false}
                    />
                    <form onSubmit={this.handleSubmit}>
                        <label className="editor-menuLabel">
                            Text
                        </label>
                        <input 
                        type="text" 
                        name="text" 
                        id="text" 
                        value={this.state.textValue} 
                        onChange={this.handleChange}
                        style={{display: "block"}}
                         />

                        <label className="editor-menuLabel" style={{marginRight: "4px"}}>
                            Link
                        </label>   
                        <input type="text" name="link" id="link" value={this.state.linkValue} onChange={this.handleChange} />
  
                        <div className="linkButtons">
                            <button style={{width: "25%"}} type="button" onClick={this.props.cancel}>CANCEL</button>
                            <button type="submit" style={{backgroundColor: "#2196F3", color: "white", width: "25%"}}>APPLY</button> 
                        </div>               
    
                    </form>
                </div>
            );


    }
}

export class InlineLinkMenu extends React.Component {

    render() {
        return (
            <div>
                
            </div>
        )
    }
}