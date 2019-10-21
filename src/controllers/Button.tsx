import * as React from 'react';
import * as Model from '../model';

import * as vgTypes from '../lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: boolean) => void;
  endUpdate: () => void;
  position: {x: number, y:number};
  disabled: boolean;
  settingsType: string;
}

interface IState
{
  currentValue: boolean;
  pressing: boolean;
}

export default class Button extends React.Component<IProps, IState>
{
  // Reset state from button when not pressing - allows movement not by
  // pressing (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.pressing ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private settings: vgTypes.IButtonSettings;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const buttonSettings = require('../json/ControlSettings.json').button;

    this.settings = buttonSettings[this.props.settingsType] ?
      buttonSettings[this.props.settingsType] : buttonSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      pressing: false
    };
  }

  public render()
  {
     const settings = this.settings;

    return(
        <svg id="button" className={this.props.settingsType}
          height={settings.height} width={settings.width}
          onMouseDown={this.handleMouseDown}>

          <rect className="button-outer"
            width={settings.width} height={settings.height}
            rx={settings.rx} ry={settings.ry} />

          <rect className={`button-inner ` +
            `${this.state.currentValue ? "true" : "false"} ` +
            `${this.state.pressing ? "pressing" : ""}`}
            x={settings.offset/2} y={settings.offset/2}
            width={settings.width - settings.offset}
            height={settings.height - settings.offset}
            rx={settings.rx} ry={settings.ry} />
        </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({pressing: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    if (!this.settings.latch)
    {
      this.toggleValue();
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleMouseUp);

    this.toggleValue();

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private toggleValue = () =>
  {
    this.setState({pressing: false});

    const newValue = !this.state.currentValue;
    this.setState({currentValue: newValue});

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }
}
