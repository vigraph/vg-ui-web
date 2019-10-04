// ViGraph - Type definitions
// Copyright (c) Paul Clark 2019

export interface IPropertiesConfig
{
  [key: string]: {
    width: number,
    height: number,
    properties: {
      [key: string]: {
        controlType: string,
        subType: string,
        valueFormat?: string,
        rangeMin?: number,
        rangeMax?: number,
        increment?: number,
        available?: any[],
        x: number,
        y: number,
        connector?: {
          x: number,
          y: number
        }
      }
    }
  }
}

export interface IRawGraphItem
{
  id: string,
  outputs?: { [key: string]: Array<{element: string, prop: string}>},
  props?: { [key: string]: number | string | boolean },
  type?: string,
  elements?: Array<IRawGraphItem>, // Subgraphs
  graph?: Array<IRawGraphItem>,    // Clone
  graphs?: Array<IRawGraphItem>    // Graph Selector
}

export interface IProcessedGraphItem
{
  id: string,
  name: string,
  type: string,
  path: string,
  description: string,
  inputs: Array<{ id: string, connectorType: string, multiple?: boolean,
    prop?: boolean, x?: number, y?: number}>,
  outputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
  edges: Array<{ output: string, destId: string, input: string}>,
  // propType = "input" | "setting"
  properties?: Array<{ id: string, description: string, propType: string,
    controlType: string, subType: string, value: any, valueType: string,
    valueFormat?: string, rangeMin?: number, rangeMax?: number,
    increment?: number, available?: any[], x: number, y: number,
    connector?: {x?: number, y?: number}}>,
  subGraph?: boolean, // Subgraphs
  cloneGraph?: boolean, // Clone
  selectorGraphs?: Array<{id: string, path: string}>  // Graph Selector
}

export interface IRawMetadataItem
{
  id: string,
  description: string,
  name: string,
  section: string,
  inputs?: Array<{ type: string, multiple?: boolean}>,
  iprops?: Array<{ id: string, description: string, type: string, alias?: boolean }>,
  props?: Array<{ id: string, description: string, type: string, alias?: boolean }>,
  oprops?: Array<{ id: string, description: string, type: string, alias?: boolean }>,
  outputs?: Array<{ type: string, multiple?: boolean}>
}

export interface IProcessedMetadata
{
  [key: string]: {
    [key: string]: {
      name: string,
      section: string,
      description: string,
      inputs: Array<{ id: string, connectorType: string, multiple?: boolean,
        prop?: boolean}>,
      outputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
      properties: Array<{ id: string, type: string, propType: string,
        description: string}>,
    }
  }
}

export interface ILayoutData
{
  [key: string]: {
    x?: number,
    y?: number,
    w?: number,
    h?: number
  }
}

// radius    - Knob radius
// overlayRadius - Centre knob overlay radius
// rangeMin  - Usable knob range minimum from 0 (r, 2r)
// rangeMax  - Usable knob range maximum from 0 (r, 2r)
// offset    - Rotation offset of start from 0 (r, 2r)
// turnScale - Scale increase whilst turning knob
// logControl - Logarithmic scale control
export interface IKnobSettings
{
  radius: number,
  overlayRadius: number,
  rangeMin: number,
  rangeMax: number,
  offset: number,
  turnScale: number,
  logControl: boolean
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
  indicatorThickness: number
}

export interface IGraphSelectorSettings
{
  padding: number,
  height: number,
  width: number,
  rows: number
}

export interface ITextDisplaySettings
{
  height: number,
  width: number
}

export interface ISequenceSettings
{
  inputHeight: number,
  inputWidth: number,
  itemHeight: number,
  itemWidth: number,
  itemLength: number,
  colourSeq: boolean,
  seqLength: number
}

export interface ICurveSettings
{
  barThickness: number,
  defaultCurve: [{t: number, value: number}, {t: number, value: number}];
}
