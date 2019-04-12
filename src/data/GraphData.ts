// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// TODO: write description for this file
// TODO: move types to type description file
// TODO: get full layout data from a layout config json for each node type
// TODO: create and layout node properties
// TODO: move any currently hard-coded layout values to layout config
// TODO: if a property has an input attached the control should be disabled
// TODO: handle 'multiple' value of inputs/outputs and behaviour with 'default'
// TODO: get and add node names to model and node
// TODO: handle current lack of rangemin, rangemax and increment in graph data
// TODO: comments throughout
// TODO: refactor (and/or rename) this file in needed
// TODO: move rest client address to config or global variable
// TODO: log or display errors
// TODO: better node layout algorithm

import * as rm from 'typed-rest-client/RestClient';

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
  type: string,
  inputs: Array<{ id: string, connectorType: string}>,
  outputs: Array<{ id: string, connectorType: string, maxConnections?: number}>,
  edges: Array<{ output: string, destId: string, input: string}>,
  // propType = "iprop" | "prop" | "oprop"
  properties?: Array<{ id: string, propType: string, controlType: string,
    value: any}>
}

interface IRawMetadataItem
{
  id: string,
  description: string,
  name: string,
  section: string,
  inputs?: [{ type: string, multiple?: boolean}],
  iprops?: [{ id: string, description: string, type: string }],
  props?: [{ id: string, description: string, type: string }],
  oprops?: [{ id: string, description: string, type: string }],
  outputs?: [{ type: string, multiple?: boolean}]
}

interface IProcessedMetadata
{
  [key: string]: {
    inputs: Array<{ id: string, connectorType: string}>,
    outputs: Array<{ id: string, connectorType: string}>,
    properties: Array<{ id: string, type: string, propType: string,
      description: string}>,
  }
}

class GraphData
{
  private rest: rm.RestClient;
  private generateSuccess: (json: any) => void;
  private inputEdgeMap: { [key: string]: string[]};
  private outputEdgeMap: { [key: string]: string[]};

  public constructor()
  {
    this.rest = new rm.RestClient('vigraph-rest', 'http://localhost:33380');
    this.inputEdgeMap = {};
    this.outputEdgeMap = {};
  }

  public generateGraph(success: (json: any) => void)
  {
    this.generateSuccess = success;
    this.getGraphData();
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
        Array<{ id: string, connectorType: string}> = [];

      const pOutputs:
        Array<{ id: string, connectorType: string}> = [];

      const pProps: Array<{ id: string, type: string, propType: string,
           description: string}> = [];

      if (value.inputs)
      {
        value.inputs.forEach((input: {type: string, multiple?: boolean},
          iIndex: number) =>
          {
            pInputs.push({id: "default", connectorType: input.type});
          });
      }

      if (value.iprops)
      {
        value.iprops.forEach(
          (input: {id: string, description: string, type: string}) =>
          {
            pInputs.push({id: input.id, connectorType: input.type});

            pProps.push({id: input.id, type: input.type, propType: "iprop",
              description: input.description });
          });
      }

      if (value.props)
      {
          value.props.forEach(
            (input: {id: string, description: string, type: string}) =>
            {
              pProps.push({id: input.id, type: input.type, propType: "prop",
                description: input.description });
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
          (output: {id: string, description: string, type: string}) =>
          {
            pOutputs.push({id: output.id, connectorType: output.type});

            pProps.push({id: output.id, type: output.type, propType: "oprop",
              description: output.description });
          });
      }

      processedMetadata[value.id] =
      {
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

      const node: IProcessedGraphItem =
      {
        id: value.id,
        type: value.type,
        inputs: metadata[value.type].inputs,
        outputs: metadata[value.type].outputs,
        edges: gEdges
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

    nodes.forEach((value: IProcessedGraphItem) =>
    {
      const layout = {x: 0, y: 0, h: 50, w: 50};

      const nRank = ranks[value.id];

      if (typeof ranksCount[nRank] === "undefined")
      {
        ranksCount[nRank] = 0;
      }
      else
      {
        ranksCount[nRank] = ranksCount[nRank] + 1;
      }

      layout.x = (nRank * 150) + 10;
      layout.y = (ranksCount[nRank] * 70) + 10;

      layoutNodes.push({...value, ...layout});
    })

    return layoutNodes;
  }
}

export const graphData = new GraphData();
