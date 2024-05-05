import { cn } from "@/lib/utils";
import { MessageCircleMore } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  getOutgoers,
  MarkerType,
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  ReactFlowInstance,
  useOnSelectionChange,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { MessageNode } from "./custom-node";

const generateId = () => Math.random().toString(36).substring(7);

const verifyFlow = (nodes: Node[], edges: Edge[]): boolean => {
  // get all nodes that have empty target handle
  const emptyTargetNodes = nodes.filter((node) => {
    const connectedEdges = edges.filter((edge) => edge.target === node.id);
    return connectedEdges.length === 0;
  });

  // if there is more than 1 node that has empty target handle, flow is invalid
  return emptyTargetNodes.length <= 1;
};

export const Flow = () => {
  const elements = useMemo(
    () => [
      {
        id: "1",
        label: "Message",
        icon: MessageCircleMore,
        nodeType: "message",
      },
    ],
    []
  );

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes.map((node) => node.id));
    },
  });

  const { getNodes, getEdges } = useReactFlow();

  // wrapped all functions in useCallback to prevent unnecessary reinitialization of functions on re-render
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      const { source } = params;

      // we need to check if the source node already has an edge
      const isSourceNodeAlreadyConnected = edges.some(
        (edge) => edge.source === source
      );

      if (isSourceNodeAlreadyConnected) {
        // add the new edge and remove the old one
        setEdges((eds) =>
          addEdge(
            params,
            eds.filter((edge) => edge.source !== source)
          )
        );
      } else {
        // add the new edge
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [edges]
  );

  const nodeTypes = useMemo(() => ({ message: MessageNode }), []);

  const handleSave = useCallback(() => {
    const isValidFlow = verifyFlow(nodes, edges);
    if (!isValidFlow) {
      setErrorMessage("Cannot save flow");
    } else {
      setErrorMessage(null);
    }
  }, [nodes, edges]);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";
      setIsDragging(true);
    },
    []
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    []
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      // check if the dropped element is valid
      if (typeof type === "undefined" || !type) {
        return;
      }

      // check if reactFlowInstance is available
      if (!reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: generateId.bind(this)(),
        type,
        position,
        data: { text: "textNode" },
      };

      setNodes((nds) => nds.concat(newNode));
      setIsDragging(false);
    },
    [reactFlowInstance]
  );

  // prevented cyclic connections so that the verifyFlow function can work properly
  const isValidConnection = useCallback(
    (connection: Connection) => {
      // we are using getNodes and getEdges helpers here
      // to make sure we create isValidConnection function only once
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target);
      const hasCycle = (node: Node<any>, visited = new Set()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      if (!target) return false;
      if (target.id === connection.source) return false;
      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  return (
    <div className="h-screen w-screen bg-white flex flex-col">
      {/* Header */}
      <div className="w-full flex bg-slate-100 border-b border-slate-300 py-2">
        <div className="flex justify-center items-center flex-1">
          {errorMessage && (
            <div className="text-sm font-bold bg-red-200 px-4 py-2 rounded">
              {errorMessage}
            </div>
          )}
        </div>
        <div className="w-80 flex justify-center items-center">
          <button
            className="px-4 py-2 border border-indigo-500 rounded text-sm text-indigo-500 font-medium bg-white"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
      <div className="flex-1 flex">
        {/* Flow Builder */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            }}
            fitViewOptions={{
              maxZoom: 0.8,
            }}
            maxZoom={1}
            onInit={setReactFlowInstance}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isValidConnection={isValidConnection}
          />
        </div>
        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-slate-200">
          {selectedNodes.length > 0 ? (
            <div className="w-full flex flex-col">
              <div className="w-full flex items-center justify-center p-2 border-b border-slate-200">
                <p className="text-sm font-medium">Message</p>
              </div>
              <div className="flex flex-col w-full p-2 gap-2">
                <p className="text-sm text-gray-500">Text</p>
                <textarea
                  className="text-sm text-black border rounded p-2"
                  rows={3}
                  value={
                    nodes.find((node) => node.id === selectedNodes[0])?.data
                      .text
                  }
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNodes[0]
                          ? { ...node, data: { text: e.target.value } }
                          : node
                      )
                    );
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap p-2 w-full">
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={cn(
                    "border border-indigo-500 text-indigo-500 w-1/2 flex flex-col items-center justify-center p-2 rounded gap-2 select-none",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                  onDragStart={(e) => handleDragStart(e, element.nodeType)}
                  draggable
                >
                  <element.icon size={24} />
                  <p className="text-sm font-medium">{element.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
