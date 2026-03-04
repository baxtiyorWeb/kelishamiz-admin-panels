import { Modal } from "antd";
const AppModal = ({
  isModalOpen = false,
  setIsModalOpen = () => false,
  handleFunc, // Category'dan kelayotgan nom
  children,
  title = "",
  loading = false, // Category'da 'loading' deb uzatilgan
}) => {
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <Modal
      title={title}
      open={isModalOpen}
      onOk={handleFunc} // Endi funksiya bog'landi!
      onCancel={handleCancel}
      confirmLoading={loading} // Yuklanish animatsiyasi uchun
      destroyOnClose={true}
      okText="Saqlash"
      cancelText="Bekor qilish"
    >
      {children}
    </Modal>
  );
};


export default AppModal
