import { Modal } from "antd";

const AppModal = ({
  isModalOpen = false,
  setIsModalOpen = () => false,
  onOk, // handleFunc o'rniga onOk ishlatamiz (standart bo'yicha)
  children,
  title = "",
  confirmLoading = false, // Yuklanish holati uchun
}) => {
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={onOk} // Bu yerda setIsModalOpen(false) ni olib tashladik!
      onCancel={handleCancel}
      confirmLoading={confirmLoading}
      destroyOnClose={true} // Modal yopilganda ichini tozalash uchun
    >
      {children}
    </Modal>
  );
};

export default AppModal;