import React from "react";
import { Stage, Layer, Circle } from "react-konva";
import Konva from "konva";

const Node = (props) => {
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();
  const [text, setText] = React.useState();

  return (
    <Circle
      x={props.x}
      y={props.y}
      draggable
      radius={50}
      fill={"white"}
      stroke={"black"}
      strokeWidth={4}
      onMouseDown={() => props.toggleSelected(this)}
    ></Circle>
  );
};

const ArgGraph = () => {
  const [nodes, setNodes] = React.useState([]);
  const [args, setArgs] = React.useState([]);
  const [conflicts, setConflicts] = React.useState([]);

  const [selected, setSelected] = React.useState([]);

  const toggleSelected = (item) => {
    let index = selected.indexOf(item);
    let inArray = index !== -1;
    if (inArray) setSelected(selected.filter((x, i) => i !== index));
    else setSelected(selected.concat(item));
    console.log("filter: " + selected.filter((x, i) => i !== index));
    console.log("concat: " + selected.concat(item));
    console.log("item: " + item);
    console.log("selected: " + selected);
  };

  const [mousePos, setMousePos] = React.useState();
  const trackMouse = (e) => {
    var pos = e.currentTarget.getPointerPosition();
    setMousePos(pos);
  };

  const spawnNode = () => {
    setNodes(
      nodes.concat(
        <Node
          x={mousePos.x}
          y={mousePos.y}
          toggleSelected={toggleSelected}
        ></Node>
      )
    );
    console.log(nodes);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseMove={trackMouse}
      onDblClick={spawnNode}
    >
      <Layer>{nodes}</Layer>
    </Stage>
  );
};

export default ArgGraph;
