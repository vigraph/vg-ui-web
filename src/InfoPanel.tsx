import * as React from 'react';
import * as Model from './model';

import { vgConfig } from './lib/Config';
import { vgUtils } from './lib/Utils';
import { vgData } from './data/Data';
import { vgIcons } from './icons/Icons';

import Panel from './Panel';

interface IProps
{
  graph: Model.Graph;
  node: Model.Node | null;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
  dynamicNodeUpdate: (node: Model.Node, finished: () => void) => void;
  pinInfo: (pin: boolean) => void;
  children?: React.ReactNode;
}

interface IState
{
  editTitle: boolean
}

export default class InfoPanel extends React.Component<IProps, IState>
{
  private ipStrings: {[key: string]: string};

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      editTitle: false
    }

    this.ipStrings = vgConfig.Strings.infoPanel;
  }

  public render()
  {
    return (
      <Panel id="info" startPosition={{x: window.innerWidth - 5, y: 50}}
        horizontal={false} empty={!this.props.node}
        notifyPin={this.props.pinInfo}>
      {
        <div id="info">
          {this.createInfoPanel()}
        </div>
      }
      </Panel>
    );
  }

  // Create info panel contents - if node provided
  // Contains three sections: Node info, Input properties info, Settings info
  private createInfoPanel = () =>
  {
    const node = this.props.node;

    if (node)
    {
      const section = vgUtils.capitaliseFirstLetter(node.type.split("/")[0]);
      const type = vgUtils.capitaliseFirstLetter(node.type.split("/")[1]);

      const Icon = vgIcons.Menu[node.type] ? vgIcons.Menu[node.type] : "";
      const iconSize = vgConfig.Graph.infoPanel.iconSize;

      return <div id="info-panel">
        <div id="node-info-wrapper" className="info-header-wrapper">
          {this.createTitle(node)}
          <div id="info-node-type-wrapper">
            <div id="info-node-section" className="info-text node section">
              {section}
            </div>
            <div id="info-node-type" className="info-text node type">
              {type}
            </div>
          </div>
          <div id="info-node-icon" className="node icon">
            {
              Icon ? <Icon x={0} y={0} width={iconSize} height={iconSize}/> : ""
            }
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

  private createTitle = (node: Model.Node) =>
  {
    const title = node.displayName || node.name;

    if (this.state.editTitle)
    {
      return <input id="info-node-title-edit" type="text"
        className={"node-title-input"} autoComplete={"off"}
        defaultValue={title}
        onPointerDown={this.titleEditPointerDown}
        onBlur={this.titleEditOnBlur}
        onKeyDown={this.textBoxKeyDown}/>
    }
    else
    {
      return <div id="info-node-title" className="info-text node title"
          onPointerDown={this.handleTitlePointerDown}
          onPointerUp={this.handleTitlePointerUp}>
          {title}
        </div>
    }
  }

  // Create input properties info section with property name and
  // value display or control based on property value type
  private createInputsInfo = (node: Model.Node) =>
  {
    // Get all input properties
    const inputs = node.getProperties().filter((property: Model.Property) =>
      {
        return property.propType === "input" && property.id !== "input";
      });

    // Sort inputs based on y position of their connectors
    inputs.sort((a: Model.Property, b: Model.Property) =>
      {
        const nodeA = a.getParentNode();
        const nodeB = b.getParentNode();
        const connectorA = nodeA ? nodeA.getInputConnector(a.id) : null;
        const connectorB = nodeB ? nodeB.getInputConnector(b.id) : null;
        const posA = connectorA && nodeA ?
          nodeA.getConnectorPosition(connectorA).y : 0;
        const posB = connectorB && nodeB ?
          nodeB.getConnectorPosition(connectorB).y : 0;

        return posA - posB;
      });

    if (inputs.length)
    {
      return <div id="inputs-info-wrapper" className="info-section-wrapper">
        {inputs.map((input: Model.Property, index: number) =>
          {
            const key = "input-" + index + "-" + (typeof input.value !==
              "undefined" ? input.value.toString() : "undefined");
            const name = vgUtils.capitaliseFirstLetter(input.id);
            const disabled = input.hasConnection();

            return <div id={input.id+"-wrapper"} className={`input-wrapper
              ${disabled?"disabled":""}`}
              key={key}>
              <div id={input.id+"-name"} className={`info-text input-name`}>
                {name}
              </div>
              {this.createValueControl(input, disabled)}
            </div>
          })}
      </div>
    }
  }

  // Create settings properties info section with property name and
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
            const key = "setting-" + index + "-" + (typeof setting.value !==
              "undefined" ? setting.value.toString() : "undefined");
            const name = vgUtils.capitaliseFirstLetter(setting.id);

            return <div id={setting.id+"-wrapper"} className="setting-wrapper"
              key={key}>
              <div id={setting.id+"-name"} className="info-text setting-name">
                {name}
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
    if (typeof property.value === "undefined")
    {
      return <div id={property.id}
        className={"undefined-value-label info-text"}>{"--"}</div>
    }
    else if (property.valueFormat === "triggerButton")
    {
      return <input id={property.id} type="button" disabled={disabled}
        className={"value-button " + property.propType}
        defaultValue={property.id} onPointerUp={this.buttonTrigger}/>
    }
    // Text box input for number, text and file types. Value checking and
    // validation done in onBlur
    else if (property.valueType === "number" || property.valueType === "text" ||
      property.valueType === "file" || property.valueType === "integer")
    {
      return <input id={property.id} type="text" disabled={disabled}
        className={"value-input " + property.propType}
        defaultValue={property.value.toString()}
        onBlur={this.textBoxOnBlur} onChange={this.textBoxOnChange}
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
    else if (vgConfig.Controls.choice_data[property.valueType])
    {
      const choices = vgConfig.Controls.choice_data[property.valueType];

      return <select id={property.id} disabled={disabled}
        className={"value-select " + property.propType}
        value={choices.indexOf(property.value)}
        onChange={this.choiceValueChange}>
        {choices.map((option: string, index: number) =>
        {
          return <option key={property.id+"-"+index} value={index}
            className={"value-select-option"}>
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
          width={20} height={20} onPointerDown={this.deletePointFromCurve}>
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
          width={20} height={20} onPointerDown={this.addPointToCurve}>
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

  // Momentary button trigger
  private buttonTrigger = (e: React.PointerEvent) =>
  {
    const button =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (button)
    {
      const property = this.getProperty(e.currentTarget.id);

      if (property)
      {
        this.updateValue(property, 1,
          () => { this.updateValue(property, 0); });
      }
    }
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

  // If the property has a max range set limit text to that number of characters
  private textBoxOnChange = (e: React.ChangeEvent) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox)
    {
      // Get property object associated with text box
      const property = this.getProperty(e.currentTarget.id);

      if (property && property.valueType === "text" &&
        property.range.max !== undefined)
      {
        if (textBox.value.toString().length > property.range.max)
        {
          textBox.value = textBox.value.toString().slice(0, property.range.max);
        }
      }
    }
  }

  // Validate text box current value and update associated property value
  private textBoxOnBlur = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox)
    {
      // Get property object associated with text box
      const property = this.getProperty(e.currentTarget.id);

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

    // Scroll page back to 0,0 in case it was moved showing onscreen keyboard
    window.scrollTo(0,0);
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }

  // Update property value on check box value change (true/false)
  private checkBoxValueChange = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const checkBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (checkBox)
    {
      const property = this.getProperty(e.currentTarget.id);

      if (property)
      {
        this.updateValue(property, checkBox.checked);
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
      const property = this.getProperty(e.currentTarget.id);

      if (property)
      {
        const newValue = this.validateValue(textBox.value, property) ||
          textBox.defaultValue;

        textBox.value = newValue;
      }
    }

    // Scroll page back to 0,0 in case it was moved showing onscreen keyboard
    window.scrollTo(0,0);
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
  }

  // Validate curve point, add to curve and update
  private addPointToCurve = (e: React.PointerEvent<SVGElement>) =>
  {
    const propID = e.currentTarget.id.substring(0, e.currentTarget.id.length-4);

    const curveInputBox = document.getElementById(propID) as HTMLInputElement;

    const property = this.getProperty(propID);

    if (curveInputBox && property && !property.hasConnection())
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

  // Delete selected point from curve
  private deletePointFromCurve = (e: React.PointerEvent<SVGElement>) =>
  {
    const propID = e.currentTarget.id.substring(0, e.currentTarget.id.length-7);

    const curveDisplay =
      document.getElementById(propID+"-display") as HTMLSelectElement;

    const property = this.getProperty(propID);

    if (property && !property.hasConnection())
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

  // Choice selected from list so update property with new value
  private choiceValueChange = (e: React.FocusEvent<HTMLSelectElement>) =>
  {
    const selector =
      document.getElementById(e.currentTarget.id) as HTMLSelectElement;

    if (selector)
    {
      const property = this.getProperty(e.currentTarget.id);

      if (property)
      {
        const choices = vgConfig.Controls.choice_data[property.valueType];
        this.updateValue(property, choices[selector.selectedIndex]);
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
          v = ((property.range.max !== undefined && v > property.range.max) ?
            property.range.max : (v < 0 ? 0 : v));

          newValue = t + "," + v;
        }
      }
    }
    // Number value must be a number (float), within the properties range and
    // follow the set increment (and level of accuracy - see Utils.js)
    // Similarly for integer
    else if (property.valueType === "number" ||
      property.valueType === "integer")
    {
      newValue = (property.valueType === "number" ? parseFloat(newValue) :
        parseInt(newValue));

      if (isNaN(newValue))
      {
        newValue = property.value;
      }
      else
      {
        newValue = vgUtils.snapValueToIncrement(value, property.increment);

        newValue = (property.range.max !== undefined ?
          Math.min(newValue, property.range.max) : newValue);

        newValue = (property.range.min !== undefined ?
          Math.max(newValue, property.range.min) : newValue);

        // Number must be a power of 2
        if (property.valueFormat === "power2" && Math.log2(newValue) % 1 !== 0)
        {
          newValue = property.value;
        }
      }
    }

    return newValue;
  }

  // Update property value (engine and model)
  private updateValue = (property: Model.Property, value: any,
    success?: () => void) =>
  {
    const update = () =>
    {
      if (this.props.node && this.props.node.dynamic)
      {
        this.props.dynamicNodeUpdate(this.props.node, this.props.endUpdate);
      }
      else
      {
        this.props.update();
        this.props.endUpdate();
      }
    }

    if (this.props.node)
    {
      this.props.startUpdate();
      vgData.updateProperty(this.props.node.path, property.id, value,
        () =>
        {
          property.value = value;
          update();
          if (success)
          {
            success();
          }
        },
        () =>
        {
          // Update on failure to draw infoPanel and reset values
          update();
        });
    }
  }

  // Return property from Node
  private getProperty = (id: string) =>
  {
    if (this.props.node)
    {
      return this.props.node.getProperties().find(x => x.id === id);
    }
    else
    {
      return null;
    }
  }

  // Click (release/up) on title starts edit 'mode'
  private handleTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    this.setState({editTitle: true});
  }

  // Stop pointer down event in title propagating to graph background
  private handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.stopPropagation();
  }

  // Stop pointer event in edit box propagating to graph background
  private titleEditPointerDown = (e: React.PointerEvent<HTMLInputElement>) =>
  {
    e.stopPropagation();
  }

  // On blur (focus off) update display name of node
  private titleEditOnBlur = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox && this.props.node)
    {
      const node = this.props.node;

      vgData.updateLayout(node.path, undefined,
        {n: textBox.value.toString()}, () =>
        {
          this.props.startUpdate();
          node.displayName = textBox.value.toString();
          this.props.update();
          this.props.endUpdate();
        });
    }

    // Scroll page back to 0,0 in case it was moved showing onscreen keyboard
    window.scrollTo(0,0);
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;

    this.setState({editTitle: false});
  }


}
