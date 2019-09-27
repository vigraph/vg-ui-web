import * as React from 'react';
import * as Model from './model';

import { vgUtils } from './lib/Utils';

interface IProps
{
  graph: Model.Graph;
  node: Model.Node | null;
  update: () => void;
}

interface IState
{
  show: boolean
}

export default class InfoPanel extends React.Component<IProps, IState>
{
  private graph: Model.Graph;
  private node: Model.Node | null;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      show: true
    }

    this.graph = props.graph;
    this.node = props.node;
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
            return <div id={input.id + "-wrapper"} key={"input-"+index+"-"+
              input.value.toString()}
              className="input-wrapper">
              <div id={input.id+"-desc"} className="info-text input desc">
                {input.description}
              </div>
              <div id={input.id+"-value"} className="info-text input value">
                {input.value.toString()}
              </div>
              {this.createValueControl(input)}
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
              {this.createValueControl(setting)}
            </div>
          })}
      </div>
    }
  }

  private createValueControl = (property: Model.Property) =>
  {
    if (property.valueType === "number" || property.valueType === "text")
    {
      return <input id={property.id} className={"value-input " +
        property.propType} type="text" onBlur={this.textBoxFocusOut}
        defaultValue={property.value.toString()}/>
    }
    else if (property.valueType === "boolean")
    {
      return <input id={property.id} className={"value-input " +
        property.propType} type="checkbox" checked={property.value}
        onChange={this.checkBoxValueChange}/>
    }
  }

  private toggleShow = () =>
  {
    const show = !this.state.show;
    this.setState({show});
  }

  private textBoxFocusOut = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox)
    {
      if (this.props.node)
      {
        const property = this.props.node.getProperties().find(x => x.id ===
        e.currentTarget.id);

        if (property)
        {
          let newValue: any = "";

          if (property.valueType === "number")
          {
            newValue = parseFloat(textBox.value);
          }
          else
          {
            newValue = textBox.value;
          }

          newValue = this.validateValue(newValue, property);

          textBox.value = newValue.toString();

          if (textBox.value !== textBox.defaultValue)
          {
            property.value = textBox.value;
            this.props.update();
          }
        }
      }
    }
  }

  private validateValue = (value: any, property: Model.Property) =>
  {
    let newValue = value;

    if (property.valueFormat === "hex-colour")
    {
      if (newValue[0] !== "#")
      {
        newValue = "#" + newValue;
      }

      if (!(/^#[0-9a-f]*$/i.test(newValue)) || (newValue.length !== 7 &&
        newValue.length !== 4))
      {
        newValue = property.value;
      }
    }
    else if (property.valueFormat === "ip-address")
    {
      if (!(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i.test(newValue)))
      {
        newValue = property.value;
      }
    }
    else if (property.valueType === "number")
    {
      newValue = vgUtils.snapValueToIncrement(value, property.increment);
      newValue = Math.min(newValue, property.range.max);
      newValue = Math.max(newValue, property.range.min);
    }

    return newValue;
  }

  private checkBoxValueChange = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const checkBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (checkBox)
    {
      if (this.props.node)
      {
        const property = this.props.node.getProperties().find(x => x.id ===
        e.currentTarget.id);

        if (property)
        {
          property.value = checkBox.checked;
          this.props.update();
        }
      }
    }
  }
}
