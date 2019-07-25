import * as React from 'react';
import * as Model from './model';

import { vgUtils } from './lib/Utils'
import * as vgTypes from './lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: any[]) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
}

interface IState
{
  currentCurve: Array<{t: number, value: number}>;
  updating: boolean;
  moving: boolean;
}

export default class Curve extends React.Component<IProps, IState>
{
  // Reset state from display when not updating - allows changes not from
  // updating (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.updating || state.moving ? null :
      { currentCurve: props.property.value };
  }

  private property: Model.Property;

  private settings: vgTypes.ICurveSettings;

  private mouseUpTimeMain: number;
  private mouseUpTimePoint: number;
  private movingPoint: number;

  private curveRef: SVGSVGElement | null;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const curveSettings =
      require('./json/ControlSettings.json').curve;

    this.settings = curveSettings[this.property.subType] ?
      curveSettings[this.property.subType] : curveSettings.default;

    this.mouseUpTimeMain = 0;
    this.mouseUpTimePoint = 0;
    this.movingPoint = -1;
    this.curveRef = null;

    this.state =
    {
      currentCurve: this.property.value,
      updating: false,
      moving: false
    };

    if (this.state.currentCurve.length === 0)
    {
      vgUtils.log("Curve Component: Setting to default curve " +
        JSON.stringify(this.settings.defaultCurve));
      this.props.update(this.settings.defaultCurve);
    }
  }

  public render()
  {
    const width = this.settings.width;
    const height = this.settings.height;
    const thickness = this.settings.barThickness;
    const points: Array<{id: string, x: number, y: number}> =
      this.state.currentCurve.map((point: {t: number, value: number}) =>
      {
        const id = point.t + "," + point.value;
        const x = point.t * width;
        const y = height - ((point.value / this.settings.maxValue) *  height);
        return {id, x, y};
      });

    return(
        <svg id="curve" className={this.property.subType}>
          <svg id="curve-control-wrapper"
            x={0} y={0}
            width={width + 20 + thickness}
            height={height + 20 + thickness}>

            <rect className={"curve-x-axis curve-axis"}
              x={10} y={height + 10}
              height={thickness} width={width + thickness}/>
            <rect className={"curve-y-axis curve-axis"}
              x={10} y={10}
              height={height} width={thickness}/>

            <svg id="curve-area-wrapper"  x={10 + thickness} y={10}
              width={width} height={height}
              ref={(ref) => { this.curveRef = ref; }}>

              <rect className="curve-area-background" x={0} y={0}
                width={width} height={height}
                onMouseDown={this.handleMainMouseDown}
                onMouseUp={this.handleMainMouseUp}/>

              <svg id="curve-line-wrapper">
              {points.map(
                (point: {x: number, y: number}, index) =>
                {
                  if (index < points.length-1)
                  {
                    return <path className="curve-line" key={index}
                      d={`M ${point.x} ${point.y} L` +
                      `${points[index+1].x} ${points[index+1].y}`}/>
                  }
                  else
                  {
                    return "";
                  }
                })}
              </svg>

              <svg id="curve-points-wrapper">
              {points.map(
                (point: {id: string, x: number, y: number}, index) =>
                {
                  return <circle id={point.id}
                  className={`curve-point`}
                  key={index} cx={point.x} cy={point.y} r={5}
                  onMouseDown={this.handlePointMouseDown}
                  onMouseUp={this.handlePointMouseUp}/>
                })}
              </svg>

            </svg>

          </svg>
        </svg>
    );
  }

  private handleMainMouseDown = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.stopPropagation();
  }

  // Double click to add a new point
  private handleMainMouseUp = (e: React.MouseEvent<SVGRectElement>) =>
  {
    const date = new Date();
    const now = date.getTime();

    if (now - this.mouseUpTimeMain < 250)
    {
      const newCurve = [...this.state.currentCurve];
      newCurve.push(this.positionToPoint(vgUtils.windowToSVGPosition(
        {x: e.pageX, y: e.pageY}, this.curveRef)));

      this.updateCurve(newCurve);
    }

    this.mouseUpTimeMain = now;
  }

  // Mouse down on single point - index of point stored to be updated if moved
  private handlePointMouseDown = (e: React.MouseEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    this.setState({moving: true});
    this.props.startUpdate();

    const selectedCoords = e.currentTarget.id.split(",");

    this.movingPoint = this.state.currentCurve.findIndex((point: {t: number,
      value: number}) =>
      point.t === parseFloat(selectedCoords[0]) &&
      point.value === parseFloat(selectedCoords[1]));

    window.addEventListener("mousemove", this.handlePointMouseMove);
    window.addEventListener("mouseup", this.handlePointMouseMoveUp);
  }

  // Update point position from mouse
  private handlePointMouseMove = (e: MouseEvent) =>
  {
    if (this.movingPoint > -1 && this.state.moving)
    {
      const updatedCoords = vgUtils.windowToSVGPosition(
        {x: e.pageX, y: e.pageY}, this.curveRef);

      const updatedPoint = this.positionToPoint(updatedCoords);

      const newCurve = [...this.state.currentCurve];

      // Only update value for first and last points
      if (this.movingPoint === 0 || this.movingPoint === newCurve.length-1)
      {
        newCurve[this.movingPoint].value = updatedPoint.value;
      }
      else if (updatedPoint.t > 0 && updatedPoint.t < 1 &&
        updatedPoint.value >= 0 && updatedPoint.value <= this.settings.maxValue)
      {
        newCurve[this.movingPoint] = updatedPoint;

        // Resort and refind current moving point index
        newCurve.sort((a: {t: number, value: number},
        b: {t: number, value: number}) =>
        {
          return a.t - b.t;
        });

        this.movingPoint = newCurve.findIndex((point: {t: number,
          value: number}) =>
          point.t === updatedPoint.t &&
          point.value === updatedPoint.value);
      }

      this.setState({currentCurve: newCurve});
      this.props.update(newCurve);
    }
  }

  // Mouse up following down on point
  private handlePointMouseMoveUp = (e: MouseEvent) =>
  {
    window.removeEventListener("mousemove", this.handlePointMouseMove);
    window.removeEventListener("mouseup", this.handlePointMouseMoveUp);
    this.movingPoint = -1;
    this.setState({moving: false});
    this.props.endUpdate();
  }

  // Mouse up whilst over point - remove point if it was a double click
  private handlePointMouseUp = (e: React.MouseEvent<SVGCircleElement>) =>
  {
    const date = new Date();
    const now = date.getTime();

    // Double click
    if (now - this.mouseUpTimePoint < 250)
    {
      const pointID = e.currentTarget.id.split(",");

      const newCurve = this.state.currentCurve.filter(
        (point: {t: number, value: number}) =>
        {
          return !(point.t === parseFloat(pointID[0]) &&
            point.value === parseFloat(pointID[1]));
        });

      this.updateCurve(newCurve);
    }

    this.mouseUpTimePoint = now;
  }

  // Convert click location to point and add to property
  private positionToPoint = (position: {x: number, y: number}) =>
  {
    const width = this.settings.width;
    const height = this.settings.height;

    const newPoint = {
      t: position.x / width,
      value: (((height - position.y ) / this.settings.width ) *
        this.settings.maxValue)
    }

    return newPoint;
  }

  private updateCurve = (newCurve: Array<{t: number, value: number}>) =>
  {
    newCurve.sort((a: {t: number, value: number},
      b: {t: number, value: number}) =>
      {
        return a.t - b.t;
      });

    this.setState({updating: true});
    this.props.startUpdate();

    this.setState({currentCurve: newCurve});
    this.props.update(newCurve);

    this.setState({updating: false});
    this.props.endUpdate();
  }
}
