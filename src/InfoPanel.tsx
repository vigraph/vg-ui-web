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

  // Create hide/show toggle icon depending on current info panel visibility
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

  // Create info panel contents - if node provided and show state set
  // Contains three sections: Node info, Input properties info, Settings info
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
          <div id="info-node-id" className="info-text node id">
            {node.id}
          </div>
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

  // Create input properties info section with property description and
  // value display or control based on property value type
  private createInputsInfo = (node: Model.Node) =>
  {
    // Get all input properties
    const inputs = node.getProperties().filter((property: Model.Property) =>
      {
        return property.propType === "input";
      });

    if (inputs.length)
    {
      return <div id="inputs-info-wrapper" className="info-section-wrapper">
        {inputs.map((input: Model.Property, index: number) =>
          {
            return <div id={input.id+"-wrapper"} className="input-wrapper"
              key={"input-"+index+"-"+input.value.toString()}>
              <div id={input.id+"-desc"} className="info-text input desc">
                {input.description}
              </div>
              {this.createValueControl(input, input.hasConnection())}
            </div>
          })}
      </div>
    }
  }

  // Create settings properties info section with property description and
  // value display or control based on property value type
  private createSettingsInfo = (node: Model.Node) =>
  {
    // Get all settings properties
    const settings = node.getProperties().filter((property: Model.Property) =>
      {
        return property.propType === "setting";
      });

    if (settings.length)
    {
      return <div id="settings-info-wrapper" className="info-section-wrapper">
        {settings.map((setting: Model.Property, index: number) =>
          {
            return <div id={setting.id+"-wrapper"} className="setting-wrapper"
              key={"setting-"+index+"-"+setting.value.toString()}>
              <div id={setting.id+"-desc"} className="info-text setting desc">
                {setting.description}
              </div>
              {this.createValueControl(setting, false)}
            </div>
          })}
      </div>
    }
  }

  // Create value control or display UI depending on the property value type
  // Component ID set to property ID so that the component and property
  // object can be found and matched from the component event
  private createValueControl = (property: Model.Property, disabled: boolean) =>
  {
    // Text box input for number, text and file types. Value checking and
    // validation done in onBlur
    if (property.valueType === "number" || property.valueType === "text" ||
      property.valueType === "file")
    {
      return <input id={property.id} type="text" disabled={disabled}
        className={"value-input " + property.propType}
        defaultValue={property.value.toString()}
        onBlur={this.textBoxOnBlur}
        onKeyDown={this.textBoxKeyDown}/>
    }
    // Simple boolean check box
    else if (property.valueType === "boolean")
    {
      return <input id={property.id} type="checkbox" disabled={disabled}
        className={"value-input " + property.propType} checked={property.value}
        onChange={this.checkBoxValueChange} />
    }
    // List of available choice values, choice made on value selection change
    else if (property.valueType === "choice")
    {
      return <select id={property.id} disabled={disabled}
        className={"value-select " + property.propType}
        value={property.available.indexOf(property.value)}
        onChange={this.choiceValueChange}>
        {property.available.map((option: string, index: number) =>
        {
          return <option key={property.id+"-"+index} value={index}>
              {option}
            </option>
        })}
        </select>
    }
    // List of current curve points in a dropdown menu with delete icon to
    // delete current selection
    // Text boxes to input (t,value) with icon to add the new point to the curve
    // Note: first and last values (t=0, t=1) can't be deleted
    else if (property.valueType === "curve")
    {
      return <div id="curve-control-wrapper" className="value-input-wrapper">
        <select id={property.id + "-display"} className="curve-points-list"
          disabled={disabled}>
          {property.value.map((point: {t: number, value: number},
            index: number) =>
            {
              return <option key={property.id+"-"+index} value={index}>
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
          {"t,value"}
        </div>
        <input id={property.id} className="add-curve-input" type="text"
          defaultValue={"0,0"} disabled={disabled}
          onBlur={this.curveTextBoxOnBlur}
          onKeyDown={this.textBoxKeyDown}/>
        <svg id={property.id + "-add"} className="curve-add-icon"
          width={20} height={20} onMouseDown={this.addPointToCurve}>
          <rect className="add-icon horz" x={0} y={8} width={20} height={4}/>
          <rect className="add-icon vert" x={8} y={0} width={4} height={20}/>
        </svg>
      </div>
    }
    // Display sequence of values (sequence) or colours (hex) in an unselectable
    // drop down
    else if (property.valueType === "sequence" ||
      property.valueType === "colours")
    {
      return <select id={property.id} name={property.id + "-display"}
        className={"display " + property.propType + " " + property.valueType}
        defaultValue={"label"} disabled={disabled}>
        <option value={"label"} disabled hidden>
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

  // Toggle show state to hide/show info panel
  private toggleShow = () =>
  {
    const show = !this.state.show;
    this.setState({show});
  }

  // Pressing enter in a text box removes focus from that text box
  // Value validation and updating happens on text box onBlur (focus lost)
  // so simulates pressing enter submitting the new value
  private textBoxKeyDown = (e: React.KeyboardEvent) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    // Enter key = 13
    if (textBox && e.which === 13)
    {
      textBox.blur();
    }
  }

  // Validate text box current value and update associated property value
  private textBoxOnBlur = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox)
    {
      if (this.props.node)
      {
        // Get property object associated with text box
        const property = this.props.node.getProperties().find(x => x.id ===
        e.currentTarget.id);

        if (property)
        {
          // Validate entered value
          const newValue = this.validateValue(textBox.value, property);

          // Show user validated value
          textBox.value = newValue.toString();

          // If new value is different to the previous value (text boxes current
          // default value) then update (model and engine)
          if (textBox.value !== textBox.defaultValue)
          {
            this.updateValue(property, newValue);
          }
        }
      }
    }
  }

  // Update property value on check box value change (true/false)
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

  // Validate curve point value, reseting to default (0,0) if it is not valid
  // Note: adding the point to the curve is done when the add button is pressed
  private curveTextBoxOnBlur = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox && textBox.value !== "0,0")
    {
      if (this.props.node)
      {
        const property = this.props.node.getProperties().find(x => x.id ===
        e.currentTarget.id);

        if (property)
        {
          const newValue = this.validateValue(textBox.value, property) ||
            textBox.defaultValue;

          textBox.value = newValue;
        }
      }
    }
  }

  // Validate curve point, add to curve and update
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
          const inputPoint = this.validateValue(curveInputBox.value, property);
          if (inputPoint)
          {
            const splitInput = inputPoint.split(",");
            const newCurve: Array<{t: number, value: number}> = property.value;

            const newPoint = {t: parseFloat(splitInput[0]),
              value: parseFloat(splitInput[1])}

            // Point values rounded to 5 decimal places
            newPoint.t = Math.round(newPoint.t * 100000) / 100000;
            newPoint.value = Math.round(newPoint.value * 100000) / 100000;

            // Cannot add a point to the curve if a point with the same t value
            // is already in the curve
            const check = newCurve.find(x => x.t === newPoint.t);

            // Point valid so add to curve and resort before updating
            if (!check)
            {
              newCurve.push(newPoint);

              newCurve.sort((a: {t: number, value: number},
                  b: {t: number, value: number}) =>
                  {
                    return a.t - b.t;
                  });

              this.updateValue(property, newCurve);
            }
          }

          curveInputBox.value = "0,0";
        }
      }
    }
  }

  // Delete selected point from curve
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

          // Cannot remove first (t=0) or last (t=1) points
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

  // Choice selected from list so update property with new value
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
          this.updateValue(property,
            property.available[selector.selectedIndex]);
        }
      }
    }
  }

    // Validate given new value depending on property value format or value type
  // Value that doesn't pass validation is reset to properties current value
  // (where appropriate)
  private validateValue = (value: any, property: Model.Property) =>
  {
    let newValue = value;

    // Hex colour property must have valid hex (#rrggbb or #rgb)
    if (property.valueFormat === "hex-colour")
    {
      // Insert # if it is missing
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
    // IP address value format
    else if (property.valueFormat === "ip-address")
    {
      if (!(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i.test(newValue)))
      {
        newValue = property.value;
      }
    }
    // Curve value must be (t: number, v: number) with t!==0 and t!==1 and v>0
    // and v < property max range
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
    // Number value must be a number (float), within the properties range and
    // follow the set increment (and level of accuracy - see Utils.js)
    else if (property.valueType === "number")
    {
      newValue = parseFloat(newValue);
      if (isNaN(newValue))
      {
        newValue = property.value;
      }
      else
      {
        newValue = vgUtils.snapValueToIncrement(value, property.increment);
        newValue = Math.min(newValue, property.range.max);
        newValue = Math.max(newValue, property.range.min);
      }
    }

    return newValue;
  }

  // Update property value (engine and model)
  private updateValue = (property: Model.Property, value: any) =>
  {
    if (this.props.node)
    {
      vgData.updateProperty(this.props.node.path, property.id, value,
        () =>
        {
          property.value = value;
          this.props.update();
        },
        () =>
        {
          // Update on failure to draw infoPanel and reset values
          this.props.update();
        });
    }
  }
}
