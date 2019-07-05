// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// Class to interrogate and modify a dataflow graph within the ViGraph engine,
// as well as getting property Metadata, using REST protocol API.
// State is read/sent in JSON.  The URL format identifies a hierarchy of
// elements (nodes) by ID.
// Processes and combines graph and metadata to create graph model.

import * as rm from 'typed-rest-client/RestClient';

import { vgUtils } from '../Utils';

import * as vgType from '../Types';

const restURL = 'http://localhost:33381';
const marginPadding = { x: 40, y: 40 };
const layoutPadding = { x: 100, y: 40 };

class GraphData
{
  private rest: rm.RestClient;
  private generateSuccess?: (json: any) => void;
  private propertiesConfig: vgType.IPropertiesConfig;
  private processedMetadata?: vgType.IProcessedMetadata;
  private layoutData: vgType.ILayoutData;

  public constructor()
  {
    this.rest = new rm.RestClient('vigraph-rest', restURL);
    this.layoutData = {};
    this.propertiesConfig = require('../json/PropertiesConfig.json');
  }

  public returnMetadata()
  {
    return this.processedMetadata;
  }

  public generateGraph(success: (json: any) => void)
  {
    this.generateSuccess = success;
    this.getGraphData();
  }

  // Update property (propID) on node (nodeID) with given value (value)
  public updateProperty(nodeID: string, propID: string,
    value: number | string | boolean)
  {
    const url = restURL + "/graph/" + nodeID + "/" + propID;

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(value)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          // vgUtils.log("Update Property Success");
        }
        else
        {
          // Error
          vgUtils.log("Update Property Failure with response status: " +
            response.status)
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Property Failure with error: " + error);
      });
  }

  // Update layout data. If no value given then layout data for given id is
  // removed. Note: ID is node path
  public updateLayout(id: string, value?: {x: number, y: number})
  {
    const url = restURL + "/layout";

    if (value)
    {
      this.layoutData[id] = value;
    }
    else
    {
      delete this.layoutData[id];
    }

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(this.layoutData)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          vgUtils.log("Update Layout Success");
        }
        else
        {
          // Error
          vgUtils.log("Update Layout Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Layout Failure with error: " + error);
      });
  }

  // Update edges from output Node with an Array of all valid edges.
  // Edge removed by copying current edges, removing the edge and updating with
  // new array.
  public updateEdges(outputNodePath: string, outputID: string,
    edges: Array<{dest: string, destInput: string}>, success?: ()=>void)
  {
    const url = restURL + "/graph/" + outputNodePath + "/" + outputID;

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
          vgUtils.log("Update Edges Success");

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Update Edges Success with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Edges Success with error: " + error);
      });
  }

  // Create/add node with ID nodeID and type nodeType to Graph
  // Calls success function on PUT success
  public createNode(nodeID: string, nodeType: string, parentPath?: string,
    success?: ()=>void)
  {
    const url = restURL + "/graph/" +
      (typeof parentPath !== "undefined" ? parentPath + "/" : "") + nodeID;

    const data = {type: nodeType}

    fetch(url,
    {
      method: "PUT",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Create Node Success");

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Create Node Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Create Node Failure with error: " + error);
      });
  }

  // Delete node from Graph
  // Calls success on DELETE success
  public deleteNode(nodePath: string, success?: ()=>void)
  {
    const url = restURL + "/graph/" + nodePath;

    fetch(url,
    {
      method: "DELETE"
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Delete Node Success");

          this.updateLayout(nodePath);

          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Delete Node Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Delete Node Failure with error: " + error);
      });
  }

  // Get node and calls success with resulting (processed) node allowing it to
  // be added to the Graph model
  public getNode(nodeID: string, parentPath?: string, success?: (result: any)=>void)
  {
    this.getNodeByPath(nodeID, parentPath, success);
  }

  private async getNodeByPath(nodeID: string, parentPath?: string,
    success?: (result: vgType.IProcessedGraphItem)=>void)
  {
    try
    {
      const res: rm.IRestResponse<vgType.IRawGraphItem> =
        await this.rest.get<vgType.IRawGraphItem>('/graph/' +
          (typeof parentPath !== "undefined" ? parentPath + '/' : '') + nodeID);

      if (res.statusCode === 200 && res.result && success)
      {
        vgUtils.log("Get Node By Path Success");
        if (this.processedMetadata)
        {
          const item = this.processSingleGraphItem(res.result,
            this.processedMetadata, parentPath);

          const layout = {h: 0, w: 0};

          // Node properties layout from config
          if (this.propertiesConfig[item.type])
          {
            layout.h = this.propertiesConfig[item.type].height;
            layout.w = this.propertiesConfig[item.type].width;
          }

          success({...item, ...layout});
        }
        else
        {
          // Error - trying to create node before Graph set up
          vgUtils.log("Process Get Node Failure: Trying to process node " +
            "before full Graph set up");
        }

      }
      else
      {
        // Error with status code
        vgUtils.log("Get Node By Path Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Node By Path Failure with error: " + error);
    }
  }

  // Get data for graph layout
  private async getLayoutData(nodes: vgType.IProcessedGraphItem[],
    success: (nodes: vgType.IProcessedGraphItem[],
      layout: vgType.ILayoutData)=>void,
    failure: (nodes: vgType.IProcessedGraphItem[])=>void)
  {
    try
    {
      const res: rm.IRestResponse<vgType.ILayoutData> =
        await this.rest.get<vgType.ILayoutData>('/layout');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Layout Data Success");
        this.layoutData = res.result;
        success(nodes, this.layoutData);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Layout Data Failure with status code: " +
          res.statusCode);
        failure(nodes);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Layout Data Failure with error: " + error);
      failure(nodes);
    }
  }

  // Get data for entire graph and start processing
  private async getGraphData()
  {
    try
    {
      const res: rm.IRestResponse<vgType.IRawGraphItem[]> =
        await this.rest.get<vgType.IRawGraphItem[]>('/graph');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Graph Data Success");
        if (this.processedMetadata)
        {
          this.createGraphModel(res.result, this.processedMetadata);
        }
        else
        {
          this.getMetadata(res.result);
        }
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Graph Data Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Graph Data Failure with error: " + error);
    }
  }

  // Get properties metadata, process and pass on to creating Graph model
  private async getMetadata(rawGraphData: vgType.IRawGraphItem[])
  {
    try
    {
      const res: rm.IRestResponse<vgType.IRawMetadataItem[]> =
        await this.rest.get<vgType.IRawMetadataItem[]>('/meta');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Metadata Success");
        this.createGraphModel(rawGraphData, this.processMetadata(res.result));
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Metadata Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Metadata Failure with error: " + error);
    }
  }

  // Process metadata from raw metadata into a usable format to create Graph
  // model (see type definition file)
  private processMetadata(rawMetadata: vgType.IRawMetadataItem[]):
    vgType.IProcessedMetadata
  {
    const processedMetadata: vgType.IProcessedMetadata = {};

    rawMetadata.forEach((value: vgType.IRawMetadataItem, index: number) =>
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

      if (!processedMetadata[value.section])
      {
        processedMetadata[value.section] = {};
      }

      processedMetadata[value.section][value.id] =
        {
          name: value.name,
          section: value.section,
          inputs: pInputs,
          outputs: pOutputs,
          properties: pProps
        }
    });

    this.processedMetadata = processedMetadata;

    return processedMetadata;
  }

  // Create Graph model from processed raw graph data and metadata
  private createGraphModel(rawGraphData: vgType.IRawGraphItem[],
    metadata: vgType.IProcessedMetadata)
  {
    const nodes: vgType.IProcessedGraphItem[] = [];

    rawGraphData.forEach((value: vgType.IRawGraphItem, index: number) =>
    {
      nodes.push(this.processSingleGraphItem(value, metadata));
    })

    this.layoutGraph(nodes, (graph: any) =>
      {
        this.generateSuccess!(graph);
      });
  }

  // Process a single graph item into format to create Graph model
  // (see type definitions)
  // parentPath is the path to the node (graph item) parent e.g. graph/graph-1
  // in the case of subgraphs
  private processSingleGraphItem(item: vgType.IRawGraphItem,
    metadata: vgType.IProcessedMetadata, parentPath?: string)
  {
    // Subgraph
    const gElements: Array<vgType.IProcessedGraphItem> = [];
    if (item.elements)
    {
      item.elements.forEach((element: vgType.IRawGraphItem, index: number) =>
      {
        gElements.push(this.processSingleGraphItem(element, metadata,
          parentPath ? parentPath + "/" + item.id : item.id));
      })
    }

    // Clone
    const gCloneGraph: Array<vgType.IProcessedGraphItem> = [];
    if (item.graph)
    {
      item.graph.forEach((cloneGraph: vgType.IRawGraphItem, index: number) =>
      {
        gCloneGraph.push(this.processSingleGraphItem(cloneGraph, metadata,
          parentPath ? parentPath + "/" + item.id : item.id));
      })
    }

    // Graph Selector
    const gSelectorGraphs: Array<vgType.IProcessedGraphItem> = [];
    if (item.graphs)
    {
      item.graphs.forEach((selectorGraph: vgType.IRawGraphItem, index: number) =>
      {
        gSelectorGraphs.push(this.processSingleGraphItem(selectorGraph, metadata,
          parentPath ? parentPath + "/" + item.id : item.id));
      })
    }

    const gEdges:
      Array<{ output: string, destId: string, input: string}> = [];

    if (item.outputs)
    {
      for (const key of Object.keys(item.outputs))
      {
        item.outputs[key].forEach(
          (vOutput: {element: string, prop: string}) =>
          {
            gEdges.push({ output: key, destId: vOutput.element,
              input: vOutput.prop})
          });
      }
    }

    const gProps: Array<{ id: string, propType: string, controlType: string,
      subType: string, value: any, rangeMin?: number, rangeMax?: number,
      increment?: number, available?: any[], x: number, y:number}> = [];

    let itemSection, itemType;

    if (item.type && item.props)
    {
      const splitType = item.type.split(":");
      itemSection = splitType[0];
      itemType = splitType[1];

      // Node properties from metadata
      if (this.propertiesConfig[item.type])
      {
        for (const key of Object.keys(item.props))
        {
          const fProp =  metadata[itemSection][itemType].properties.find(x =>
              x.id === key);
          const propType = fProp ? fProp.propType : "prop";

          gProps.push({id: key, value: item.props[key],
            propType,
            ...this.propertiesConfig[item.type].properties[key]});
        };
      }

      // Special case - store selector elements' 'graphs' in the available
      // section of the value property
      if (gSelectorGraphs.length > 0)
      {
        const valueIndex = gProps.findIndex(x => x.id === "value");

        if (valueIndex)
        {
          gProps[valueIndex].available = [...gSelectorGraphs];
        }
      }
    }

    const node: vgType.IProcessedGraphItem =
    {
      id: item.id,
      name: itemSection && itemType ? metadata[itemSection][itemType].name : "",
      type: item.type ? item.type : "",
      path: parentPath ? parentPath + "/" + item.id : item.id,
      inputs: itemSection && itemType ?
        metadata[itemSection][itemType].inputs : [],
      outputs: itemSection && itemType ?
        metadata[itemSection][itemType].outputs : [],
      edges: gEdges,
      properties: gProps,
      elements: item.elements ? gElements : undefined,
      cloneGraph: item.graph ? gCloneGraph : undefined,
      selectorGraphs: item.graphs ? gSelectorGraphs : undefined
    };

    return node;
  }

  // Layout Graph and pass full graph on to final success callback
  public layoutGraph(nodes: vgType.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    this.getLayoutData(nodes,
      (lNodes: vgType.IProcessedGraphItem[], layout: vgType.ILayoutData) =>
        {
          this.processLayout(lNodes, layout, success);
        },
      (lNodes: vgType.IProcessedGraphItem[]) =>
        {
          this.generateLayout(lNodes, success);
        }
    );
  }

  // Process layout data and combine with node data
  private processLayout(nodes: vgType.IProcessedGraphItem[], layout:
    vgType.ILayoutData, success: (json: any) => void)
  {
    const layoutNodes: any[] = [];

    nodes.forEach((value: vgType.IProcessedGraphItem) =>
    {
      const propConfig = this.propertiesConfig[value.type];
      const nodeLayout =
      {
        x: layout[value.path] ? layout[value.path].x : 0,
        y: layout[value.path] ? layout[value.path].y : 0,
        h: propConfig ? propConfig.height : 50,
        w: propConfig ? propConfig.width : 50
      }

      layoutNodes.push({...value, ...nodeLayout});
    });

    const graph = { "nodes" : layoutNodes };
    success(graph);
  }

  // Generate Graph layout without node position data. Nodes ranked by number of
  // parents and laid out without overlapping
  private generateLayout(nodes: vgType.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    // Store input and output IDs used to layout Graph without
    // node position data
    const inputEdgeMap: { [key: string]: string[] } = {};
    const outputEdgeMap: { [key: string]: string[] } = {};

    nodes.forEach((node: vgType.IProcessedGraphItem, index: number) =>
    {
      node.edges.forEach((edge: {output: string, destId: string, input: string},
        eIndex: number) =>
      {
        inputEdgeMap[edge.destId] ? inputEdgeMap[edge.destId].push(node.id) :
          inputEdgeMap[edge.destId] = [node.id];

        outputEdgeMap[node.id] ? outputEdgeMap[node.id].push(edge.destId) :
          outputEdgeMap[node.id] = [edge.destId];
      })
    })

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

        if (outputEdgeMap[name])
        {
          rankNodes(rank+1, outputEdgeMap[name]);
        }
      });
    }

    for (const key of Object.keys(outputEdgeMap))
    {
      if (!inputEdgeMap[key])
      {
        leaves.push(key);
        ranks[key] = 0;
        rankNodes(1, outputEdgeMap[key]);
      }
    }

    const ranksCount: number[] = [];
    const rankNextPos: [{x: number, y: number}] = [{x: 0, y: 0}];

    nodes.forEach((value: vgType.IProcessedGraphItem) =>
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
      this.layoutData[value.path] = {x: layout.x, y: layout.y};
    })

    const graph = { "nodes" : layoutNodes };
    success(graph);
  }
}

export const graphData = new GraphData();
