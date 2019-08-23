// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// Class to interrogate and modify a dataflow graph within the ViGraph engine,
// as well as getting property Metadata, using REST protocol API.
// State is read/sent in JSON.  The URL format identifies a hierarchy of
// elements (nodes) by ID.
// Processes and combines graph, metadata and layout data to create graph model.

import * as rm from 'typed-rest-client/RestClient';

import * as vgTypes from '../lib/Types';
import { vgUtils } from '../lib/Utils';

const restURL = 'http://localhost:33381';
const marginPadding = { x: 40, y: 40 };
const layoutPadding = { x: 100, y: 40 };

class Data
{
  private rest: rm.RestClient;
  private generateSuccess?: (json: any) => void;
  private propertiesConfig: vgTypes.IPropertiesConfig;
  private processedMetadata: vgTypes.IProcessedMetadata;
  private layoutData: vgTypes.ILayoutData;

  public constructor()
  {
    this.rest = new rm.RestClient('vigraph-rest', restURL);
    this.propertiesConfig = require('../json/PropertiesConfig.json');
    this.processedMetadata = {};
    this.layoutData = {};
  }

  //============================================================================
  // Public access/update functions
  //============================================================================

  public returnMetadata()
  {
    return this.processedMetadata;
  }

  // Update property (propID) on node (nodeID) with given value (value)
  public updateProperty(nodeID: string, propID: string,
    value: any, success?: () => void)
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
          if (success)
          {
            success();
          }
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

  // Update node (nodeID) with given (non-property) data
  public updateNode(nodeID: string, data: any, success?: () => void)
  {
    const url = restURL + "/graph/" + nodeID;

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
          // vgUtils.log("Update Node Data Success");
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Update Node Data Failure with response status: " +
            response.status)
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Update Node Data Failure with error: " + error);
      });
  }

  // Update layout data. If no position or size given then layout data for
  // given id is removed. If no id given then this.layoutData is sent with
  // no updates.
  // Note: ID is node path
  public updateLayout(id?: string, position?: {x: number, y: number},
    size?: {w: number, h: number})
  {
    const url = restURL + "/layout";

    if (id)
    {
      if (!position && !size)
      {
        delete this.layoutData[id];
      }
      else
      {
        this.layoutData[id] = {...this.layoutData[id], ...position, ...size};
      }
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

  // Delete given path (e.g. Graph in Graph selector)
  // Calls success on DELETE success
  public deletePath(path: string, success?: ()=>void)
  {
    const url = restURL + "/graph/" + path;

    fetch(url,
    {
      method: "DELETE"
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Delete Path Success");


          // Success
          if (success)
          {
            success();
          }
        }
        else
        {
          // Error
          vgUtils.log("Delete Path Failure with response" +
            " status: " + response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Delete Path Failure with error: " + error);
      });
  }

  // Add an empty graph with given ID (used by Graph Selector)
  // Calls success function on PUT success with processed empty graph item
  public addEmptyGraph(id: string, path: string,
    success?: (graph: vgTypes.IProcessedGraphItem)=>void)
  {
    const url = restURL + "/graph/" + path + "/graph/" + id;

    const data: [] = [];

    fetch(url,
    {
      method: "PUT",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          vgUtils.log("Add Graph Success");

          // Success
          if (success)
          {
            const item = this.processSingleGraphItem({id, elements: []},
              path+'/graph');
            success(item);
          }
        }
        else
        {
          // Error
          vgUtils.log("Add Graph Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgUtils.log("Add Graph Failure with error: " + error);
      });
  }

  public getRawSelectorGraphs(path: string,
    success?: (graphs: vgTypes.IRawGraphItem[])=>void)
  {
    this.getRawGraphItem(path, (result: vgTypes.IRawGraphItem) =>
    {
      if (success)
      {
        success(result.graphs?result.graphs:[]);
      }
    })
  }

  // Get node and calls success with resulting (processed) node allowing it to
  // be added to the Graph model
  public getNode(nodeID: string, parentPath?: string,
    success?: (result: any) => void)
  {
    vgUtils.log("Get Node: " + nodeID);

    const path = (typeof parentPath !== "undefined" ? parentPath + '/' : '') +
      nodeID;

    this.getRawGraphItem(path, (result) =>
    {
      vgUtils.log("Process raw node");
      if (this.processedMetadata)
      {
        const item = this.processSingleGraphItem(result, parentPath);

        const propConfig = this.propertiesConfig[item.type];

        // Node properties layout (height and width)
        const h = this.layoutData[item.path] && this.layoutData[item.path].h ?
          this.layoutData[item.path].h : (propConfig ? propConfig.height : 0);
        const w = this.layoutData[item.path] && this.layoutData[item.path].w ?
          this.layoutData[item.path].w : (propConfig ? propConfig.width : 0);
        const layout = {h, w}

        if (success) success({...item, ...layout});
      }
      else
      {
        // Error - trying to create node before Graph set up
        vgUtils.log("Process Get Node Failure: Trying to process node " +
          "before full Graph set up");
      }
    })
  }

  private async getRawGraphItem(path: string,
    success?: (result: vgTypes.IRawGraphItem)=>void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawGraphItem> =
        await this.rest.get<vgTypes.IRawGraphItem>('/graph/' + path);

      if (res.statusCode === 200 && res.result && success)
      {
        vgUtils.log("Get Raw Graph Item By Path Success");
        success(res.result);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Raw Graph Item Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Raw Graph Item Failure with error: " + error);
    }
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

  //============================================================================
  // Generate Graph from Graph data, Metadata and Layout data
  //============================================================================

  // Generate Graph by getting metadata, layout data and graph data and then
  // processing and combining
  public generateGraph(success: (json: any) => void, source?:
    {sourcePath: string, parentPath?: string})
  {
    this.generateSuccess = success;

    const getLayout = () =>
    {
      if (Object.keys(this.layoutData).length > 0)
      {
        if (source)
        {
          this.getGraphDataFromSource(source);
        }
        else
        {
          this.getGraphData();
        }
      }
      else
      {
        this.getLayoutData(() => { this.getGraphData(); });
      }
    }

    if (Object.keys(this.processedMetadata).length > 0)
    {
      getLayout();
    }
    else
    {
      this.getMetadata(() => {getLayout()});
    }
  }

  //============================================================================
  // Metadata
  //============================================================================

  // Get properties metadata, process and then store
  private async getMetadata(success: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawMetadataItem[]> =
        await this.rest.get<vgTypes.IRawMetadataItem[]>('/meta');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Metadata Success");
        this.processMetadata(res.result);
        success();
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
  private processMetadata(rawMetadata: vgTypes.IRawMetadataItem[]):
    vgTypes.IProcessedMetadata
  {
    const processedMetadata: vgTypes.IProcessedMetadata = {};

    rawMetadata.forEach((value: vgTypes.IRawMetadataItem, index: number) =>
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

    // Store processsed metadata
    this.processedMetadata = processedMetadata;

    return processedMetadata;
  }

  //============================================================================
  // Layout Data
  //============================================================================

  // Get data for graph layout
  private async getLayoutData(finished: () => void)
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.ILayoutData> =
        await this.rest.get<vgTypes.ILayoutData>('/layout');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Layout Data Success");
        this.layoutData = res.result;
        finished();
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Layout Data Failure with status code: " +
          res.statusCode);
        finished();
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Layout Data Failure with error: " + error);
      finished();
    }
  }

  // Layout Graph and pass full graph on to final success callback
  public layoutGraph(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    // Process layout using stored layout data. If layout data not found
    // for given nodes then layout automatically generated
    this.processLayout(nodes, success,
      (lNodes: vgTypes.IProcessedGraphItem[]) =>
      {
        this.generateLayout(lNodes, success);
      });
  }

  // Process layout data and combine with node data
  private processLayout(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void,
    failure: (nodes: vgTypes.IProcessedGraphItem[]) => void)
  {
    const layout = this.layoutData;
    const layoutNodes: any[] = [];
    let successCount = 0;

    nodes.forEach((value: vgTypes.IProcessedGraphItem) =>
    {
      const propConfig = this.propertiesConfig[value.type];

      if (layout[value.path])
      {
        successCount++;
      }

      const height = layout[value.path] && layout[value.path].h ?
        layout[value.path].h : (propConfig ? propConfig.height : 50);
      const width = layout[value.path] && layout[value.path].w ?
        layout[value.path].w : (propConfig ? propConfig.width : 50);

      const nodeLayout =
      {
        x: layout[value.path] ? layout[value.path].x : 0,
        y: layout[value.path] ? layout[value.path].y : 0,
        h: height,
        w: width
      }

      layoutNodes.push({...value, ...nodeLayout});
    });

    if (successCount > 0)
    {
      const graph = { "nodes" : layoutNodes };
      success(graph);
    }
    else
    {
      failure(nodes);
    }
  }

  // Generate Graph layout without node position data. Nodes ranked by number of
  // parents and laid out without overlapping
  private generateLayout(nodes: vgTypes.IProcessedGraphItem[],
    success: (json: any) => void)
  {
    // Store input and output IDs used to layout Graph without
    // node position data
    const inputEdgeMap: { [key: string]: string[] } = {};
    const outputEdgeMap: { [key: string]: string[] } = {};

    nodes.forEach((node: vgTypes.IProcessedGraphItem, index: number) =>
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

    nodes.forEach((value: vgTypes.IProcessedGraphItem) =>
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

    this.updateLayout();

    const graph = { "nodes" : layoutNodes };
    success(graph);
  }

  //============================================================================
  // Graph Data
  //============================================================================

  // Get data for entire graph and create graph model
  private async getGraphData()
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawGraphItem[]> =
        await this.rest.get<vgTypes.IRawGraphItem[]>('/graph');

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Graph Data Success");
        this.createGraphModel(res.result);
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

  // Get data for entire graph and create graph model
  private async getGraphDataFromSource(source: {sourcePath: string,
    parentPath?: string})
  {
    try
    {
      const res: rm.IRestResponse<vgTypes.IRawGraphItem[]> =
        await this.rest.get<vgTypes.IRawGraphItem[]>('/graph/' +
          source.sourcePath);

      if (res.statusCode === 200 && res.result)
      {
        vgUtils.log("Get Graph Data From Source Success");
        this.createGraphModel(res.result, source.parentPath);
      }
      else
      {
        // Error with status code
        vgUtils.log("Get Graph Data From Source Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgUtils.log("Get Graph Data From Source Failure with error: " + error);
    }
  }

  // Create Graph model from processed raw graph data
  private createGraphModel(rawGraphData: vgTypes.IRawGraphItem[],
    parentPath?: string)
  {
    const nodes: vgTypes.IProcessedGraphItem[] = [];

    rawGraphData.forEach((value: vgTypes.IRawGraphItem, index: number) =>
    {
      nodes.push(this.processSingleGraphItem(value, parentPath));
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
  private processSingleGraphItem(item: vgTypes.IRawGraphItem,
    parentPath?: string)
  {
    const metadata = this.processedMetadata;

    // Graph Selector
    const gSelectorGraphs: Array<{id: string, path: string}> = [];
    if (item.graphs)
    {
      item.graphs.forEach((selectorGraph: vgTypes.IRawGraphItem,
        index: number) =>
      {
        gSelectorGraphs.push({id: selectorGraph.id,
          path: parentPath ?
            (parentPath + "/" + item.id + "/graph/" + selectorGraph.id) :
            (item.id + "/graph/" + selectorGraph.id)});
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
      // section of the value property (id and path)
      if (gSelectorGraphs.length > 0)
      {
        const valueIndex = gProps.findIndex(x => x.id === "value");

        if (valueIndex)
        {
          gProps[valueIndex].available = [...gSelectorGraphs];
        }
      }
    }

    const node: vgTypes.IProcessedGraphItem =
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
      subGraph: !!item.elements,
      cloneGraph: !!item.graph,
      selectorGraphs: item.graphs ? gSelectorGraphs : undefined
    };

    return node;
  }
}

export const vgData = new Data();
