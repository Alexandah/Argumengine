import React from "react";
import { Stage, Layer, Circle, Text } from "react-konva";
import Konva from "konva";

const Node = (props) => {
  const [text, setText] = React.useState();

  return (
    <Text
      text={"x: " + props.x + " y: " + props.y}
      x={props.x}
      y={props.y}
      draggable
      onMouseDown={() => props.toggleSelected(props.id)}
      onDragMove={(e) => {
        var pos = e.currentTarget.getAbsolutePosition();
        props.updateNodePos(props.id, pos.x, pos.y);
      }}
    ></Text>
  );
};

const ArgGraph = () => {
  const [nodes, setNodes] = React.useState([]);
  const [args, setArgs] = React.useState([]);
  const [conflicts, setConflicts] = React.useState([]);

  const toggleSelected = (selectedIndex) => {
    setNodes(
      nodes.map((node, index) => {
        if (index == selectedIndex) {
          node.selected = !node.selected;
          return node;
        } else return node;
      })
    );
  };

  const [mousePos, setMousePos] = React.useState();
  const trackMouse = (e) => {
    var pos = e.currentTarget.getPointerPosition();
    setMousePos(pos);
  };

  const spawnNode = () => {
    setNodes(
      nodes.concat({
        x: mousePos.x,
        y: mousePos.y,
        selected: false,
      })
    );
  };

  const updateNodePos = (selectedIndex, x, y) => {
    setNodes(
      nodes.map((node, index) => {
        if (index == selectedIndex) {
          node.x = x;
          node.y = y;
          return node;
        } else return node;
      })
    );
    console.log(nodes);
  };

  const deleteNode = (node) => {
    setNodes(nodes.filter((x, i) => i !== nodes.indexOf(node)));
    console.log(nodes);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseMove={trackMouse}
      onDblClick={spawnNode}
    >
      <Layer>
        {nodes.map((node, i) => {
          return (
            <Node
              key={i}
              id={i}
              x={node.x}
              y={node.y}
              toggleSelected={toggleSelected}
              updateNodePos={updateNodePos}
            ></Node>
          );
        })}
      </Layer>
    </Stage>
  );
};

export default ArgGraph;
