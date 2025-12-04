import { Modal } from "antd";
const AppModal = ({
  isModalOpen = false,
  setIsModalOpen = () => false,
  handleFunc = () => {},
  children,
  title = "",
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
        title={title}
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
