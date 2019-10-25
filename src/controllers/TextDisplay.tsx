import * as React from 'react';
import * as Model from '../model';

import * as vgTypes from '../lib/Types';
import { vgConfig } from '../lib/Config';
import { vgUtils } from '../lib/Utils';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: string) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
  disabled: boolean;
  settingsType: string;
}

interface IState
{
  currentText: string;
  editing: boolean;
  updating: boolean;
}

export default class TextDisplay extends React.Component<IProps, IState>
{
  // Reset state from display when not updating - allows changes not from
  // updating (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.updating ? null :
      { currentText: props.property.value };
  }

  private property: Model.Property;

  private settings: vgTypes.ITextDisplaySettings;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const textDisplaySettings = vgConfig.Controls.textDisplay;

    this.settings = textDisplaySettings[this.props.settingsType] ?
      textDisplaySettings[this.props.settingsType] : textDisplaySettings.default;

    this.state =
    {
      currentText: this.property.value,
      editing: false,
      updating: false
    };

    if (this.state.currentText === "")
    {
      vgUtils.log("TextDisplay Component: Setting to default text " +
        JSON.stringify(this.settings.defaultText));
      this.props.update(this.settings.defaultText);
    }
  }

  public render()
  {
    const fontSize = this.settings.fontSize;

    const linesArray = vgUtils.wrapText(this.state.currentText,
        this.settings.width, fontSize);

    const height = linesArray.length * (vgUtils.textBoundingSize(linesArray[0],
      fontSize).height + 2);

    return(
        <svg id="text-display" className={this.props.settingsType}
          onDoubleClick={this.toggleEditing}>
          <svg id="text-display-wrapper"
            x={0} y={0}
            width={this.settings.width} height={height}>
            <text id="text-display-text" className="label"
              fontSize={fontSize} x={this.settings.width/2} y={15}>
            {linesArray.map((word: string, index: number) =>
            {
              return <tspan key={index} x={this.settings.width/2}
                dy={index*(fontSize+2)}>{word}</tspan>
            })}
            </text>
          </svg>
          {this.state.editing && <svg className="text-display-editing-wrapper">
            <rect className="text-display-editing-border"
              x={0} y={0}
              width={this.settings.width} height={height}/>
        </svg>}
        </svg>
    );
  }

  private toggleEditing = () =>
  {
    const newEditState = !this.state.editing;
    this.setState({editing: newEditState});
    if (newEditState)
    {
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("mousedown", this.toggleEditing);
    }
    else
    {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("mousedown", this.toggleEditing);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) =>
  {
    let newText = this.state.currentText;

    if (e.which === 8)
    {
      newText = newText.slice(0, newText.length - 1);
    }
    else if (e.which === 13)
    {
      this.setState({editing: !this.state.editing});
      window.removeEventListener("keydown", this.handleKeyDown);
    }
    else if (e.key.length === 1)
    {
      newText += e.key;
    }

    this.updateText(newText);
  }

  private updateText = (newText: string) =>
  {
    this.setState({updating: true});
    this.props.startUpdate();

    this.setState({currentText: newText});
    this.props.update(newText);

    this.setState({updating: false});
    this.props.endUpdate();
  }
}
