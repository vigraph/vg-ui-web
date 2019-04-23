// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// TODO: write description for this file
// TODO: move types to type description file
// TODO: comments throughout
// TODO: calculate knob background based on range min and max
// TODO: refactor (and/or rename) this file in needed
// TODO: move rest client address to config or global variable
// TODO: log or display errors
// TODO: better node layout algorithm
// TODO: description for config file
// TODO: default layout - layout without the need for properties config
// (in a line with type:number = Knob etc)
// TODO: hide/show property value option
// TODO: 'trigger' should have a momentary button
// TODO: if a property has an input attached the control should be disabled
// TODO: handle 'multiple' value of inputs/outputs and behaviour with 'default'
// TODO: show values and node labels on (time delay) mouse over
// TODO: layout node properties nicely
// TODO: update value using rest put
// TODO: split property name and value
// TODO: mouse wheel zoom
// TODO: grab/move background to scroll around

import * as rm from 'typed-rest-client/RestClient';

interface IPropertiesConfig
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

interface IRawGraphItem
{
  id: string,
  outputs?: { [key: string]: Array<{element: string, prop: string}>},
  props: { [key: string]: number | string | boolean },
  type: string
}

interface IProcessedGraphItem
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

interface IRawMetadataItem
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

interface IProcessedMetadata
{
  [key: string]: {
    name: string,
    inputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
    outputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
    properties: Array<{ id: string, type: string, propType: string,
      description: string}>,
  }
}

const restURL = 'http://localhost:33380';
const marginPadding = { x: 40, y: 40 };
const layoutPadding = { x: 100, y: 40 };

class GraphData
{
  private rest: rm.RestClient;
  private generateSuccess: (json: any) => void;
  private inputEdgeMap: { [key: string]: string[]};
  private outputEdgeMap: { [key: string]: string[]};
  private propertiesConfig: IPropertiesConfig;

  public constructor()
  {
    this.rest = new rm.RestClient('vigraph-rest', restURL);
    this.inputEdgeMap = {};
    this.outputEdgeMap = {};

    this.propertiesConfig = require('./PropertiesConfig.json');
  }

  public generateGraph(success: (json: any) => void)
  {
    this.generateSuccess = success;
    this.getGraphData();
  }

  public updateProperty(nodeID: string, propID: string,
    value: number | string | boolean)
  {
    const url = restURL + "/graph/" + nodeID + "/";
    const data = {[propID]: value};

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
        }
        else
        {
          // Error
        }
      })
    .catch(error =>
      {
        // Error
      });
  }

  public updateEdges(outputNodeID: string, outputID: string,
    edges: Array<{dest: string, destInput: string}>, success?: ()=>void)
  {
    const url = restURL + "/graph/" + outputNodeID + "/" + outputID;

    const data: Array<{"element": string, "prop": string}> = [];

    edges.forEach((value: {dest: string, destInput: string}) =>
    {
      data.push({"element": value.dest, "prop": value.destInput});
    })

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
        }
      })
    .catch(error =>
      {
        // Error
      });
  }

  private async getGraphData()
  {
    try
    {
      const res: rm.IRestResponse<IRawGraphItem[]> =
        await this.rest.get<IRawGraphItem[]>('/graph');

      if (res.statusCode === 200 && res.result)
      {
        this.getMetadata(res.result);
      }
      else
      {
        // Error with status code - res.StatusCode;
      }
    }
    catch (error)
    {
      // Error with status code - res.StatusCode;
    }
  }

  private async getMetadata(rawGraphData: IRawGraphItem[])
  {
    try
    {
      const res: rm.IRestResponse<IRawMetadataItem[]> =
        await this.rest.get<IRawMetadataItem[]>('/meta');

      if (res.statusCode === 200 && res.result)
      {
        this.createGraphModel(rawGraphData, this.processMetadata(res.result));
      }
      else
      {
        // Error with status code - res.StatusCode;
      }
    }
    catch (error)
    {
      // Error with status code - res.StatusCode;
    }
  }

  private processMetadata(rawMetadata: IRawMetadataItem[]):
    IProcessedMetadata
  {
    const processedMetadata: IProcessedMetadata = {};

    rawMetadata.forEach((value: IRawMetadataItem, index: number) =>
    {
      const pInputs:
        Array<{ id: string, connectorType: string, multiple?: boolean}> = [];

      const pOutputs:
        Array<{ id: string, connectorType: string, multiple?: boolean}> = [];

      const pProps: Array<{ id: string, type: string, propType: string,
           description: string}> = [];

      if (value.inputs)
      {
        value.inputs.forEach((input: {type: string, multiple?: boolean},
          iIndex: number) =>
          {
            pInputs.push({id: "default", connectorType: input.type,
              multiple: !!input.multiple});
          });
      }

      if (value.iprops)
      {
        value.iprops.forEach(
          (input: {id: string, description: string, type: string,
            alias?: boolean}) =>
          {
            pInputs.push({id: input.id, connectorType: input.type});

            if (!input.alias)
            {
              pProps.push({id: input.id, type: input.type, propType: "iprop",
                description: input.description });
            }
          });
      }

      if (value.props)
      {
          value.props.forEach(
            (prop: {id: string, description: string, type: string,
              alias?: boolean}) =>
            {
              if (!prop.alias)
              {
                pProps.push({id: prop.id, type: prop.type, propType: "prop",
                  description: prop.description });
              }
            });
      }

      if (value.outputs)
      {
        value.outputs.forEach((output: {type: string, multiple?: boolean},
          oIndex: number) =>
          {
            pOutputs.push({id: "default", connectorType: output.type});
          });
      }

      if (value.oprops)
      {
        value.oprops.forEach(
          (output: {id: string, description: string, type: string,
            alias?: boolean}) =>
          {
            pOutputs.push({id: output.id, connectorType: output.type});

            if (!output.alias)
            {
              pProps.push({id: output.id, type: output.type, propType: "oprop",
                description: output.description });
            }
          });
      }

      processedMetadata[value.id] =
      {
        name: value.name,
        inputs: pInputs,
        outputs: pOutputs,
        properties: pProps
      };
    });

    return processedMetadata;
  }

  private createGraphModel(rawGraphData: IRawGraphItem[],
    metadata: IProcessedMetadata)
  {
    const nodes: IProcessedGraphItem[] = [];

    rawGraphData.forEach((value: IRawGraphItem, index: number) =>
    {
      const gEdges:
        Array<{ output: string, destId: string, input: string}> = [];

      if (value.outputs)
      {
        for (const key of Object.keys(value.outputs))
        {
          value.outputs[key].forEach(
            (vOutput: {element: string, prop: string}) =>
            {
              gEdges.push({ output: key, destId: vOutput.element,
                input: vOutput.prop})

              this.inputEdgeMap[vOutput.element] ?
                this.inputEdgeMap[vOutput.element].push(value.id) :
                this.inputEdgeMap[vOutput.element] = [value.id];

               this.outputEdgeMap[value.id] ?
                this.outputEdgeMap[value.id].push(vOutput.element) :
                this.outputEdgeMap[value.id] = [vOutput.element];
            });
        }
      }

      const gProps: Array<{ id: string, propType: string, controlType: string,
        subType: string, value: any, rangeMin?: number, rangeMax?: number,
        increment?: number, available?: string[], x: number, y:number}> = [];


      if (this.propertiesConfig[value.type])
      {
        for (const key of Object.keys(value.props))
        {
          const fProp =  metadata[value.type].properties.find(x =>
              x.id === key);
          const propType = fProp ? fProp.propType : "prop";

          gProps.push({id: key, value: value.props[key],
            propType,
            ...this.propertiesConfig[value.type].properties[key]});
        };
      }

      const node: IProcessedGraphItem =
      {
        id: value.id,
        name: metadata[value.type].name,
        type: value.type,
        inputs: metadata[value.type].inputs,
        outputs: metadata[value.type].outputs,
        edges: gEdges,
        properties: gProps
      };

      nodes.push(node);
    })

    this.layoutGraph(nodes);
  }

  private layoutGraph(nodes: IProcessedGraphItem[])
  {
    const graph = { "nodes" : this.generateLayout(nodes)};

    this.generateSuccess(graph);
  }

  private generateLayout(nodes: IProcessedGraphItem[])
  {
    const layoutNodes: any[] = [];

    const leaves: string[] = [];
    const ranks: { [key: string] : number } = {};

    const rankNodes = (rank: number, rNodes: string[]) =>
    {
      rNodes.forEach((name: string) =>
      {
        if (!ranks[name] || ranks[name] < rank)
        {
          ranks[name] = rank;
        }

        if (this.outputEdgeMap[name])
        {
          rankNodes(rank+1, this.outputEdgeMap[name]);
        }
      });
    }

    for (const key of Object.keys(this.outputEdgeMap))
    {
      if (!this.inputEdgeMap[key])
      {
        leaves.push(key);
        ranks[key] = 0;
        rankNodes(1, this.outputEdgeMap[key]);
      }
    }

    const ranksCount: number[] = [];
    const rankNextPos: [{x: number, y: number}] = [{x: 0, y: 0}];

    nodes.forEach((value: IProcessedGraphItem) =>
    {
      const layout = {x: 0, y: 0, h: 50, w: 50};

      if (this.propertiesConfig[value.type])
      {
        layout.h = this.propertiesConfig[value.type].height;
        layout.w = this.propertiesConfig[value.type].width;
      }

      const nRank = ranks[value.id] ? ranks[value.id] : 0;

      if (typeof ranksCount[nRank] === "undefined")
      {
        ranksCount[nRank] = 0;
      }
      else
      {
        ranksCount[nRank] = ranksCount[nRank] + 1;
      }

      // Position nodes in this rank based on the previous nodes height and
      // the nodes in the next rank based on the largest (width) node so far

      if (!rankNextPos[nRank])
      {
        rankNextPos[nRank] = {x: 0, y: 0};
      }

      layout.x = (rankNextPos[nRank].x) + (nRank === 0 ? marginPadding.x :
        layoutPadding.x);
      layout.y = (rankNextPos[nRank].y) + layoutPadding.y;

      rankNextPos[nRank] = {x: rankNextPos[nRank].x,
        y: layout.y + layout.h};

      if (!rankNextPos[nRank+1])
      {
        rankNextPos[nRank+1] = {x: 0, y: 0};
      }

      rankNextPos[nRank+1] = {x: Math.max(layout.x + layout.w,
        rankNextPos[nRank+1].x),
        y: rankNextPos[nRank+1].y};

      layoutNodes.push({...value, ...layout});
    })

    return layoutNodes;
  }
}

export const graphData = new GraphData();
