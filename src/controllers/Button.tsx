import * as React from 'react';
import * as Model from '../model';

import * as vgTypes from '../lib/Types';
import { vgConfig } from '../lib/Config';

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

  private latchPrevious: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const buttonSettings = vgConfig.Controls.button;

    this.settings = buttonSettings[this.props.settingsType] ?
      buttonSettings[this.props.settingsType] : buttonSettings.default;

    this.latchPrevious = this.property.value;

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
          onPointerDown={this.handlePointerDown}>

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

  // Set value to true on button down
  private handlePointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('pointerup', this.handlePointerUp);

    this.setState({pressing: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    const newValue = true;

    if (!this.state.currentValue)
    {
      this.setState({currentValue: newValue});

      if (this.props.update)
      {
        this.props.update(newValue);
      }
    }
  }

  // Set value to false on button down unless latching (toggle)
  private handlePointerUp = (e: PointerEvent) =>
  {
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.setState({pressing: false});

    let newValue = false;

    if (this.settings.latch)
    {
      this.latchPrevious = !this.latchPrevious;
      newValue = this.latchPrevious;
    }

    if (this.state.currentValue !== newValue)
    {
      this.setState({currentValue: newValue});

      if (this.props.update)
      {
        this.props.update(newValue);
      }
    }

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }
}
