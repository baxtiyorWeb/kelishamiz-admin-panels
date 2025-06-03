import React, { useState } from "react";
import Table from "./../components/Table";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import { message, Popconfirm, Tooltip, Select, Tag } from "antd";

const { Option } = Select;

const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
};

const Users = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", page, pageSize],
    queryFn: async () => {
      const response = await api.get(
        `/users?pageSize=${pageSize}&page=${page}`
      );
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to fetch users");
      }
      return response.data; // Backenddan kelgan to'liq javob
    },
    onError: (error) => {
      console.error("Error fetching users:", error);
      message.error("Foydalanuvchilarni yuklashda xatolik yuz berdi.");
    },
    onSuccess: (data) => {
      console.log("Users fetched successfully:", data);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: 1000,
  });

  // MA'LUMOTLARNI OLISH YO'LI YANGILANDI
  const userItems = get(data, "content.users", []); // userItems ni content.users dan olamiz
  const totalUsers = get(data, "content.total", 0); // totalUsers ni content.total dan olamiz
  const currentPage = get(data, "content.page", 1); // current page ni content.page dan olamiz
  const currentTotalPages = get(data, "content.totalPages", 1); // totalPages ni content.totalPages dan olamiz

  const { mutate: updateUserRole } = useMutation({
    mutationFn: async ({ id, newRole }) => {
      const response = await api.patch(`/users/${id}/role`, {
        role: newRole,
      });
      if (response.status !== 200 || !response.data) {
        message.error("Foydalanuvchi rolini yangilashda xatolik yuz berdi");
        throw new Error("Failed to update user role");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error updating user role:", error);
      message.error("Foydalanuvchi rolini yangilashda xatolik yuz berdi.");
    },
    onSuccess: () => {
      message.success("Foydalanuvchi roli muvaffaqiyatli yangilandi");
      refetch();
    },
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/users/${id}`);
      if (response.status !== 200 && response.status !== 204) {
        throw new Error("Failed to delete user");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      message.error("Foydalanuvchini o'chirishda xatolik yuz berdi.");
    },
    onSuccess: () => {
      message.success("Foydalanuvchi muvaffaqiyatli o'chirildi");
      refetch();
    },
  });

  const handleRoleChange = (userId, newRole) => {
    updateUserRole({ id: userId, newRole });
  };

  const handleDeleteUser = (id) => {
    deleteUser(id);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Telefon",
      dataIndex: "phone",
      key: "phone",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[120px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <Tooltip title={text}>
          <div className="truncate max-w-[120px]">{text}</div>
        </Tooltip>
      ),
    },
    {
      title: "Full Name",
      // Agar backendda profile.fullName mavjud bo'lsa, uni ishlatish
      // Aks holda, username ko'rsatish
      dataIndex: ["profile", "fullName"],
      key: "fullName",
      render: (text, record) => (
        <Tooltip title={text || record.username}>
          <div className="truncate max-w-[150px]">
            {text || record.username || "N/A"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Region",
      // Agar backendda profile.region.name mavjud bo'lsa, uni ishlatish
      // Aks holda, regionId ni ko'rsatish
      dataIndex: ["profile", "region", "name"],
      key: "regionName",
      render: (text, record) => (
        <Tooltip title={text || record.regionId}>
          <div className="truncate max-w-[100px]">
            {text || record.regionId || "N/A"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "District",
      // Agar backendda profile.district.name mavjud bo'lsa, uni ishlatish
      // Aks holda, districtId ni ko'rsatish
      dataIndex: ["profile", "district", "name"],
      key: "districtName",
      render: (text, record) => (
        <Tooltip title={text || record.districtId}>
          <div className="truncate max-w-[100px]">
            {text || record.districtId || "N/A"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <Select
          defaultValue={role}
          style={{ width: 120 }}
          onChange={(newRole) => handleRoleChange(record.id, newRole)}
        >
          {Object.values(UserRole).map((r) => (
            <Option key={r} value={r}>
              {r === UserRole.ADMIN ? (
                <Tag color="red">ADMIN</Tag>
              ) : (
                <Tag color="blue">USER</Tag>
              )}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title={`Siz ID: ${record.id} bo'lgan foydalanuvchini o'chirishga ishonchingiz komilmi?`}
          onConfirm={() => handleDeleteUser(record.id)}
          okText="Ha"
          cancelText="Yo'q"
        >
          <a className="text-red-500 hover:text-red-400">O'chirish</a>
        </Popconfirm>
      ),
    },
  ];

  if (isError) {
    return <div>Foydalanuvchilarni yuklashda xatolik yuz berdi.</div>;
  }

  return (
    <div>
      <Table
        dataSource={userItems}
        columnDefs={columns}
        isLoading={isLoading}
        page={currentPage} // Backenddan kelgan page ni ishlatamiz
        pageSize={pageSize}
        total={totalUsers}
        setPage={setPage}
        setPageSize={setPageSize}
      />
    </div>
  );
};

export default Users;
