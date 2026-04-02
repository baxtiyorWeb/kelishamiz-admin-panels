import React from "react";
import { Cascader } from "antd";

const CascaderComponent = ({ options, onChange }) => (
  <Cascader
    options={options}
    onChange={onChange}
    expandTrigger="hover"
    placeholder="Please selec\\t"
  />
);
export default CascaderComponent;
