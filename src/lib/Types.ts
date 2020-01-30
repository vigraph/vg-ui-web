// ViGraph - Type definitions
// Copyright (c) Paul Clark 2019

export interface IRawGraphItem
{
  type: string, // section/name
  dynamic: boolean,
  inputs?:
  {
    [key: string]: IRawProperty
  },
  settings?:
  {
    [key: string]: IRawProperty
  },
  outputs?:
  {
    [key: string]:
    {
      connections?: Array<{ element: string, input: any }>,
      type: string,
      sample_rate: number
    }
  },
  // Subgraphs
  elements?:
  {
    [key: string]: IRawGraphItem,
  }
}

export interface IRawProperty
{
  type: string,
  value: any,
  sample_rate?: number
}

export interface IProcessedGraphItem
{
  id: string,
  name: string,
  displayName?: string,
  type: string,
  path: string,
  dynamic: boolean,
  category?: string,
  description?: string,
  inputs: Array<{ id: string, type: string, sampleRate: number, x?: number,
    y?: number}>,
  outputs: Array<{ id: string, type: string, sampleRate: number}>,
  edges: Array<{ output: string, destId: string, input: string}>,
  // propType = "input" | "setting"
  properties?: Array<{ id: string, value: any, valueType: string,
    propType: string, description?: string, controlType?: string,
    valueFormat?: string, rangeMin?: number, rangeMax?: number,
    increment?: number, x?: number, y?: number}>,
  subGraph?: boolean
}

export interface ICombinedGraph
{
  graph: IRawGraphItem,
  layout: ILayoutData
}

export interface IMetadata
{
  // Section ID
  [key: string]:
  {
    // Element ID
    [key: string]:
    {
      name: string,
      dynamic: boolean,
      category?: string,
      settings?:
      {
        // Setting ID
        [key: string]:
        {
          type: string
        }
      }
      inputs?:
      {
        // Input ID
        [key: string]:
        {
          type: string
        }
      }
      outputs?:
      {
        // Output ID
        [key: string]:
        {
          type: string
        }
      }
    }
  }
}

export interface IPropertiesConfig
{
  [key: string]: {
    width: number,
    height: number,
    category?: string,
    properties: {
      [key: string]: {
        controlType?: string,
        x?: number,
        y?: number,
        valueFormat?: string,
        rangeMin?: number,
        rangeMax?: number,
        increment?: number,
        connector?: {
          x?: number,
          y: number
        }
      }
    }
  }
}

export interface ILanguageStrings
{
  infoPanel:
  {
    [key: string]: string
  },
  descriptions:
  {
    [key: string]:
    {
      description: string,
      properties?:
      {
        [key: string]:
        {
          description: string
        }
      }
    }
  }
}

export interface ILayoutData
{
  [key: string]: {
    x?: number,
    y?: number,
    w?: number,
    h?: number,
    n?: string
  }
}

// radius    - Knob radius
// overlayRadius - Centre knob overlay radius
// rangeMin  - Usable knob range minimum from 0 (r, 2r)
// rangeMax  - Usable knob range maximum from 0 (r, 2r)
// offset    - Rotation offset of start from 0 (r, 2r)
// turnScale - Scale increase whilst turning knob
// logControl - Logarithmic scale control
// controlMode - Knob control mode
export interface IKnobSettings
{
  radius: number,
  overlayRadius: number,
  rangeMin: number,
  rangeMax: number,
  offset: number,
  turnScale: number,
  logControl: boolean,
  controlMode: string
}

export interface ISliderSettings
{
  length: number,
  thickness: number,
  horizontal: boolean,
  slideScale: number,
  dialThickness: number,
  clickMove: boolean,
  logControl: boolean
}

export interface IButtonSettings
{
  height: number,
  width: number,
  rx: number,
  ry: number,
  offset: number,
  circle: boolean,
  latch: boolean
}

export interface ISelectorSettings
{
  length: number,
  thickness: number,
  horizontal: boolean
}

export interface IColourPickerSettings
{
  barLength: number,
  barThickness: number,
  padding: number,
  indicatorThickness: number,
  displaySize: number
}

export interface ITextDisplaySettings
{
  width: number,
  defaultText: string,
  fontSize: number
}

export interface ISequenceSettings
{
  inputHeight: number,
  inputWidth: number,
  itemHeight: number,
  itemWidth: number,
  itemLength: number,
  colourSeq: boolean,
  seqLength: number,
  rows: number
}

export interface ICurveSettings
{
  barThickness: number,
  defaultCurve: [{t: number, value: number}, {t: number, value: number}];
}
