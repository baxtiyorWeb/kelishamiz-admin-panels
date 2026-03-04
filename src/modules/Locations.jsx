"use client";

import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import { Button, message, Popconfirm, Select, Spin } from "antd";
import { Plus, Trash2 } from "lucide-react";

import Table from "./../components/Table";
import ModalComponent from "./../components/Modal";
import InputComponent from "../components/Input";
import api from "./../config/auth/api";

const Locations = () => {
  const queryClient = useQueryClient();
  
  // States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocationType, setSelectedLocationType] = useState("region"); // Filter uchun
  const [filterRegionId, setFilterRegionId] = useState(null); // Tumanlarni filterlash uchun
  
  // Form States
  const [createType, setCreateType] = useState("region"); // Modal ichidagi tur
  const [name, setName] = useState("");
  const [targetRegionId, setTargetRegionId] = useState(null);

  // --- API QUERIES ---

  // Asosiy jadval ma'lumotlari
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["locations", selectedLocationType, filterRegionId],
    queryFn: async () => {
      const endpoint = selectedLocationType === "region" 
        ? "/location/regions" 
        : `/location/districts/${filterRegionId || ""}`;
      
      const response = await api.get(endpoint);
      // Interceptor content ichida qaytaradi
      return response.data?.content || response.data || [];
    },
  });

  // Viloyatlar ro'yxati (Select'lar uchun)
  const { data: regionsData } = useQuery({
    queryKey: ["regions-list"],
    queryFn: async () => {
      const response = await api.get("/location/regions");
      return response.data?.content || response.data || [];
    },
  });

  const locationList = useMemo(() => (isArray(locationsData) ? locationsData : []), [locationsData]);
  const regionOptions = useMemo(() => {
    const list = isArray(regionsData) ? regionsData : [];
    return list.map(r => ({ label: r.name, value: r.id }));
  }, [regionsData]);

  // --- MUTATIONS ---

  const handleLocationMutate = useMutation({
    mutationFn: async (payload) => {
      const endpoint = createType === "region" ? "/location/region" : "/location/district";
      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["locations"]);
      queryClient.invalidateQueries(["regions-list"]);
      message.success("Muvaffaqiyatli qo'shildi! 🎉");
      
      // MODAL YOPILMAYDI, faqat nom tozalanadi
      setName("");
      // createType va targetRegionId saqlanib qoladi (ketma-ket qo'shish uchun)
    },
    onError: (error) => {
      message.error(get(error, "response.data.message", "Xatolik yuz berdi"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (record) => {
      const type = selectedLocationType === "region" ? "region" : "district";
      return api.delete(`/location/${record.id}/${type}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["locations"]);
      message.success("O'chirildi! 🗑️");
    },
  });

  // --- HANDLERS ---

  const handleSubmit = () => {
    if (!name.trim()) return message.warning("Nomini kiriting!");
    
    const payload = { name: name.trim() };
    if (createType === "district") {
      if (!targetRegionId) return message.warning("Viloyatni tanlang!");
      payload.regionId = targetRegionId;
    }

    handleLocationMutate.mutate(payload);
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Nomi", dataIndex: "name", key: "name" },
    {
      title: selectedLocationType === "region" ? "Tumanlar soni" : "Viloyat",
      key: "info",
      render: (_, record) => 
        selectedLocationType === "region" 
          ? (record.districts?.length || 0) 
          : (record.region?.name || "—")
    },
    {
      title: "Harakat",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Popconfirm title="O'chirasizmi?" onConfirm={() => deleteMutation.mutate(record)}>
          <Button type="text" danger icon={<Trash2 size={18} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Select
            style={{ width: 150 }}
            value={selectedLocationType}
            options={[
              { label: "Viloyatlar", value: "region" },
              { label: "Tumanlar", value: "district" },
            ]}
            onChange={(val) => {
              setSelectedLocationType(val);
              setFilterRegionId(null);
            }}
          />
          
          {selectedLocationType === "district" && (
            <Select
              style={{ width: 200 }}
              placeholder="Viloyat bo'yicha filter"
              allowClear
              options={regionOptions}
              onChange={(val) => setFilterRegionId(val)}
            />
          )}
        </div>

        <Button 
          type="primary" 
          icon={<Plus size={18} />} 
          onClick={() => setIsModalOpen(true)}
        >
          Location qo'shish
        </Button>
      </div>

      <Table
        dataSource={locationList}
        columnDefs={columns}
        loading={isLoading}
        rowKey="id"
      />

      <ModalComponent
        title="Yangi joy qo'shish"
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        handleFunc={handleSubmit}
        loading={handleLocationMutate.isPending}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block mb-1 font-medium">Turini tanlang</label>
            <Select
              className="w-full"
              value={createType}
              onChange={(val) => setCreateType(val)}
              options={[
                { value: "region", label: "Viloyat qo'shish" },
                { value: "district", label: "Tuman qo'shish" },
              ]}
            />
          </div>

          {createType === "district" && (
            <div>
              <label className="block mb-1 font-medium">Qaysi viloyatga?</label>
              <Select
                className="w-full"
                placeholder="Viloyatni tanlang"
                options={regionOptions}
                value={targetRegionId}
                onChange={(val) => setTargetRegionId(val)}
              />
            </div>
          )}

          <div>
            <label className="block mb-1 font-medium">Nomi</label>
            <InputComponent
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Toshkent"
            />
          </div>
        </div>
      </ModalComponent>
    </div>
  );
};

export default Locations;
