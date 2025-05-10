import React from "react";
import { Button, Modal } from "antd";
const AppModal = ({
  isModalOpen = false,
  setIsModalOpen = () => false,
  handleFunc = () => {},
  children,
}) => {
  const handleOk = () => {
    setIsModalOpen(false);
    handleFunc();
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      <Modal
        title="Basic Modal"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        {children}
      </Modal>
    </>
  );
};
export default AppModal;
