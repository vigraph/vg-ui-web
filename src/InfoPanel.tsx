import * as React from 'react';
import * as Model from './model';

import { vgUtils } from './lib/Utils';
import { vgData } from './data/Data';

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
  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      show: true
    }
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
          <path className="info-panel-icon show arrowhead"
            d="M 10,0 20,10 10,20 z"/>
          <rect className="info-panel-icon show arrowbody" x={0} y={7}
            width={10} height={6}/>
        </svg>
      </div>
    }
    else
    {
      return <div id="info-show-icon" className="info-visible-icon">
        <svg id="info-show-icon-svg" x={0} y={0} width={20} height={20}
          onMouseUp={this.toggleShow}>
          <path className="info-panel-icon hide arrowhead"
            d="M 0,10 10,0 10,20 z"/>
          <rect className="info-panel-icon hide arrowbody" x={10} y={7}
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
              {this.createValueControl(input, input.hasConnection())}
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
              {this.createValueControl(setting, false)}
            </div>
          })}
      </div>
    }
  }

  private createValueControl = (property: Model.Property, disabled: boolean) =>
  {
    if (property.valueType === "number" || property.valueType === "text" ||
      property.valueType === "file")
    {
      return <input id={property.id} className={"value-input " +
        property.propType} type="text" onBlur={this.textBoxFocusOut}
        defaultValue={property.value.toString()} disabled={disabled}
        onKeyDown={this.textBoxKeyDown}/>
    }
    else if (property.valueType === "boolean")
    {
      return <input id={property.id} className={"value-input " +
        property.propType} type="checkbox" checked={property.value}
        onChange={this.checkBoxValueChange} disabled={disabled}/>
    }
    else if (property.valueType === "choice")
    {
      return <select id={property.id} className={"value-select " +
        property.propType} onChange={this.choiceValueChange}
        value={property.available.indexOf(property.value)} disabled={disabled}>
        {property.available.map((option: string, index: number) =>
        {
          return <option key={property.id+index} value={index}>{option}</option>
        })}
        </select>
    }
    else if (property.valueType === "curve")
    {
      return <div id="curve-control-wrapper" className="value-input-wrapper">
        <select id={property.id + "-display"} className="curve-points-list"
          disabled={disabled}>
        {property.value.map((point: {t: number, value: number}, index: number) =>
        {
          return <option key={property.id+index} value={index}>
            {point.t+","+point.value}</option>
        })}
        </select>
        <svg id={property.id + "-delete"} className="curve-delete-icon"
          width={20} height={20} onMouseDown={this.deletePointFromCurve}>
          <rect className="delete-icon horz" x={0} y={8} width={20} height={4}
            transform="rotate(45 10 10)"/>
          <rect className="delete-icon vert" x={8} y={0} width={4} height={20}
            transform="rotate(45 10 10)"/>
        </svg>
        <div id="add-curve-label" className="info-text add-curve">
          {"t,value"}</div>
        <input type="text" id={property.id} className="add-curve-input"
          defaultValue={"0,0"} onBlur={this.curveTextBoxFocusOut}
          disabled={disabled} onKeyDown={this.textBoxKeyDown}/>
        <svg id={property.id + "-add"} className="curve-add-icon" width={20}
          height={20} onMouseDown={this.addPointToCurve}>
          <rect className="add-icon horz" x={0} y={8} width={20} height={4}/>
          <rect className="add-icon vert" x={8} y={0} width={4} height={20}/>
        </svg>
      </div>
    }
    else if (property.valueType === "sequence" ||
      property.valueType === "colours")
    {
      return <select id={property.id} className={"display " +
        property.propType + " " + property.valueType}
        name={property.id + "-display"} disabled={disabled}>
        <option value={"default"} selected disabled hidden>
          {property.id}
        </option>
        {property.value.map((option: string, index: number) =>
        {
          return <option key={property.id+index} value={index} disabled>
            {option}
            </option>
        })}
        </select>
    }
  }

  private toggleShow = () =>
  {
    const show = !this.state.show;
    this.setState({show});
  }

  private textBoxKeyDown = (e: React.KeyboardEvent) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox && e.which === 13)
    {
      textBox.blur();
    }
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
            if (isNaN(newValue))
            {
              newValue = parseFloat(textBox.defaultValue);
            }
          }
          else
          {
            newValue = textBox.value;
          }

          newValue = this.validateValue(newValue, property);

          textBox.value = newValue.toString();

          if (textBox.value !== textBox.defaultValue)
          {
            this.updateValue(property, newValue);
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
    else if (property.valueType === "curve")
    {
      const curvePoint = newValue.split(",");

      if (curvePoint.length !== 2)
      {
        newValue = null;
      }
      else
      {
        let t = parseFloat(curvePoint[0]);
        let v = parseFloat(curvePoint[1]);

        if (isNaN(t) || isNaN(v))
        {
          newValue = null;
        }
        else
        {
          t = (t > 1 ? 1 : (t < 0 ? 0 : t));
          v = (v > property.range.max ? property.range.max : (v < 0 ? 0 : v));
          newValue = t + "," + v;
        }

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
          this.updateValue(property, checkBox.checked);
        }
      }
    }
  }

  private curveTextBoxFocusOut = (e: React.FocusEvent<HTMLInputElement>) =>
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
          let newValue;

          newValue = this.validateValue(textBox.value, property);
          if (!newValue)
          {
            newValue = textBox.defaultValue;
          }

          textBox.value = newValue;
        }
      }
    }
  }

  private addPointToCurve = (e: React.MouseEvent<SVGElement>) =>
  {
    const propID = e.currentTarget.id.substring(0, e.currentTarget.id.length-4);

    if (this.props.node)
    {
      const property = this.props.node.getProperties().find(x => x.id ===
       propID);

      if (property && !property.hasConnection())
      {
        const curveInputBox =
          document.getElementById(propID) as HTMLInputElement;

        if (curveInputBox)
        {
          const splitInput = curveInputBox.value.split(",");
          const newCurve: Array<{t: number, value: number}> = property.value;

          const newPoint = {t: parseFloat(splitInput[0]),
            value: parseFloat(splitInput[1])}

          newPoint.t = Math.round(newPoint.t * 100000) / 100000;
          newPoint.value = Math.round(newPoint.value * 100000) / 100000;

          const check = newCurve.find(x => x.t === newPoint.t);

          if (!check)
          {
            newCurve.push(newPoint);

            newCurve.sort((a: {t: number, value: number},
                b: {t: number, value: number}) =>
                {
                  return a.t - b.t;
                });

            this.updateValue(property, newCurve);

            curveInputBox.value = "0,0";
          }
        }
      }
    }
  }

  private deletePointFromCurve = (e: React.MouseEvent<SVGElement>) =>
  {
    const propID = e.currentTarget.id.substring(0, e.currentTarget.id.length-7);

    if (this.props.node)
    {
      const property = this.props.node.getProperties().find(x => x.id ===
       propID);

      if (property && !property.hasConnection())
      {
        const curveDisplay =
          document.getElementById(propID+"-display") as HTMLSelectElement;

        if (curveDisplay)
        {
          const selectedIndex = curveDisplay.selectedIndex;

          if (selectedIndex !== 0 && selectedIndex !== property.value.length-1)
          {
            const selection = property.value[selectedIndex];

            const newCurve = property.value.filter(
              (point: {t: number, value: number}) =>
              {
                return !(point.t === selection.t && point.value ===
                  selection.value);
              });

            this.updateValue(property, newCurve);
          }
        }
      }
    }
  }

  private choiceValueChange = (e: React.FocusEvent<HTMLSelectElement>) =>
  {
    const selector =
      document.getElementById(e.currentTarget.id) as HTMLSelectElement;

    if (selector)
    {
      if (this.props.node)
      {
        const property = this.props.node.getProperties().find(x => x.id ===
        e.currentTarget.id);

        if (property)
        {
          this.updateValue(property, property.available[selector.selectedIndex]);
        }
      }
    }
  }

  private updateValue = (property: Model.Property, value: any) =>
  {
    if (this.props.node)
    {
      vgData.updateProperty(this.props.node.path, property.id, value,
        () =>
        {
          property.value = value;
          this.props.update();
        });
    }
  }
}
