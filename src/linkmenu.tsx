import React from 'react';


export class LinkMenu extends React.Component<{submitLink: (text: string, link: string) => void}, {textValue: string, linkValue: string}> {
    

    constructor(props: any) {
        super(props);
        this.state = {
            textValue: '',
            linkValue: ''
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
        this.props.submitLink(this.state.textValue, this.state.linkValue);
    }
    render() {
        return (
            <div className="linkMenu">
                <form onSubmit={this.handleSubmit}>
                    <label className="editor-menuLabel" style={{display: "block"}}>
                        Text
                    <input type="text" name="text" value={this.state.textValue} onChange={this.handleChange} />
                    </label>
                    <label className="editor-menuLabel">
                        Link
                    <input type="text" name="link" value={this.state.linkValue} onChange={this.handleChange} />
                    </label>     
                    <div className="linkButtons">
                        <button>CANCEL</button>
                        <input type="submit" value="APPLY" />
                    </div>               

                </form>
            </div>
        );
    }
}