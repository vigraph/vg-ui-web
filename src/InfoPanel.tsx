import * as React from 'react';

import * as Model from './model';

interface IProps
{
  graph: Model.Graph;
  node: Model.Node | null;
  deleteNode: (node: Model.Node) => void;
}

interface IState
{
  show: boolean
}

export default class InfoPanel extends React.Component<IProps, IState>
{
  private graph: Model.Graph;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      show: true
    }

    this.graph = props.graph;
  }

  public render()
  {
    return (
      <div id="info" className={`${this.state.show ?
        "shown" : "hidden"} ${!this.props.node ? "empty" : ""}`}>
        {this.createVisibilityIcon()}
        {this.createInfoPanel()}
      </div>
    );
  }

  private createVisibilityIcon = () =>
  {
    if (this.state.show)
    {
      return <div id="info-hide-icon" className="info-visible-icon">
        <svg id="info-hide-icon-svg" x={0} y={0} width={20} height={20}
          onMouseUp={this.toggleShow}>
          <path className="info-panel-icon hide arrowhead"
            d="M 0,10 10,0 10,20 z"/>
          <rect className="info-panel-icon hide arrowbody" x={10} y={7}
            width={10} height={6}/>
        </svg>
      </div>
    }
    else
    {
      return <div id="info-show-icon" className="info-visible-icon">
        <svg id="info-show-icon-svg" x={0} y={0} width={20} height={20}
          onMouseUp={this.toggleShow}>
          <path className="info-panel-icon show arrowhead"
            d="M 10,0 20,10 10,20 z"/>
          <rect className="info-panel-icon show arrowbody" x={0} y={7}
            width={10} height={6}/>
        </svg>
      </div>
    }
  }

  private createInfoPanel = () =>
  {
    const node = this.props.node;

    if (node && this.state.show)
    {
      const section = node.type.split(":")[0];
      return <div id="info-panel">
        <div id="node-info-wrapper" className="info-section-wrapper">
          <div id="info-node-name" className="info-text node name">
            {node.name}
          </div>
          <div id="info-node-id" className="info-text node id">{node.id}</div>
          <div id="info-node-desc" className="info-text node desc">
            {node.description}
          </div>
          <div id="info-node-section" className="info-text node section">
            {section}
          </div>
        </div>
        {this.createInputsInfo(node)}
        {this.createSettingsInfo(node)}
      </div>
    }
    else
    {
      return ""
    }
  }

  private createInputsInfo = (node: Model.Node) =>
  {
    const inputs = node.getProperties().filter((property: Model.Property) =>
      {
        return property.propType === "input";
      });

    if (inputs.length)
    {
      return <div id="inputs-info-wrapper" className="info-section-wrapper">
        {inputs.map((input: Model.Property, index: number) =>
          {
            return <div id={input.id + "-wrapper"} key={"input-"+index}
              className="input-wrapper">
              <div id={input.id+"-desc"} className="info-text input desc">
                {input.description}
              </div>
              <div id={input.id+"-value"} className="info-text input value">
                {input.value.toString()}
              </div>
            </div>
          })}
      </div>
    }
  }

  private createSettingsInfo = (node: Model.Node) =>
  {
    const settings = node.getProperties().filter((property: Model.Property) =>
      {
        return property.propType === "setting";
      });

    if (settings.length)
    {
      return <div id="settings-info-wrapper" className="info-section-wrapper">
        {settings.map((setting: Model.Property, index: number) =>
          {
            return <div id={setting.id + "-wrapper"} key={"setting-"+index}
              className="setting-wrapper">
              <div id={setting.id+"-desc"} className="info-text setting desc">
                {setting.description}
              </div>
              <div id={setting.id+"-value"} className="info-text setting value">
                {setting.value.toString()}
              </div>
            </div>
          })}
      </div>
    }

  }

  private toggleShow = () =>
  {
    const show = !this.state.show;
    this.setState({show});
  }
}
