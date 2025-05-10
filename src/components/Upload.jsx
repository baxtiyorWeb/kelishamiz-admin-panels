// FileUploadComponent.jsx
import React from "react";
import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";

const FileUploadComponent = ({ onFileSelect }) => {
  const customProps = {
    beforeUpload: (file) => {
      onFileSelect(file); // Faylni parentga yuborish
      return false; // avtomatik upload bo‘lmasin
    },
    showUploadList: false,
  };

  return (
    <Upload {...customProps}>
      <Button icon={<UploadOutlined />}>Click to Upload</Button>
    </Upload>
  );
};

export default FileUploadComponent;
