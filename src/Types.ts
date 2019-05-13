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
        rangeMin?: number,
        rangeMax?: number,
        increment?: number,
        available?: string[],
        x: number,
        y: number
      }
    }
  }
}

export interface IRawGraphItem
{
  id: string,
  outputs?: { [key: string]: Array<{element: string, prop: string}>},
  props: { [key: string]: number | string | boolean },
  type: string
}

export interface IProcessedGraphItem
{
  id: string,
  name: string,
  type: string,
  inputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
  outputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
  edges: Array<{ output: string, destId: string, input: string}>,
  // propType = "iprop" | "prop" | "oprop"
  properties?: Array<{ id: string, propType: string, controlType: string,
    subType: string, value: any, rangeMin?: number, rangeMax?: number,
    increment?: number, available?: string[], x: number, y:number}>
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
      inputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
      outputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
      properties: Array<{ id: string, type: string, propType: string,
        description: string}>,
    }
  }
}

export interface ILayoutData
{
  [key: string]: {
    x: number,
    y: number
  }
}
