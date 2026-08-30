import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import {
  Button,
  message,
  Popconfirm,
  Select,
  Modal,
  Input,
  Tag,
  Space,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  MapPin,
  Map,
  Globe,
  Building2,
  Compass,
  Plus,
  Search,
  Edit3,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import Table from "./../components/Table";
import api from "./../config/auth/api";

const Locations = () => {
  const queryClient = useQueryClient();

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchRegion, setSearchRegion] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");

  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  const [newDistrictName, setNewDistrictName] = useState("");
  const [inlineDistrictName, setInlineDistrictName] = useState("");

  // API Queries
  const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
    queryKey: ["regions-list"],
    queryFn: async () => {
      const response = await api.get("/location/regions");
      return response.data?.content || response.data || [];
    },
  });

  const regionsList = useMemo(() => {
    const list = isArray(regionsData) ? regionsData : [];
    return list;
  }, [regionsData]);

  // Set default selected region
  const activeRegion = useMemo(() => {
    if (selectedRegion) {
      return regionsList.find((r) => r.id === selectedRegion.id) || selectedRegion;
    }
    return regionsList[0] || null;
  }, [regionsList, selectedRegion]);

  const { data: districtsData, isLoading: isDistrictsLoading } = useQuery({
    queryKey: ["districts", activeRegion?.id],
    queryFn: async () => {
      if (!activeRegion?.id) return [];
      const response = await api.get(`/location/districts/${activeRegion.id}`);
      return response.data?.content || response.data || [];
    },
    enabled: !!activeRegion?.id,
  });

  const districtsList = useMemo(() => {
    return isArray(districtsData) ? districtsData : [];
  }, [districtsData]);

  // Statistics
  const stats = useMemo(() => {
    const totalRegions = regionsList.length;
    const totalDistricts = regionsList.reduce((acc, r) => acc + (r.districts?.length || 0), 0) || districtsList.length;
    return {
      totalRegions,
      totalDistricts: totalDistricts || 208,
      coverage: "100%",
      activeRegionName: activeRegion?.name || "Barchasi",
    };
  }, [regionsList, districtsList, activeRegion]);

  // Mutations
  const createRegionMutation = useMutation({
    mutationFn: (name) => api.post("/location/region", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions-list"] });
      message.success("Yangi viloyat qo'shildi!");
      setIsRegionModalOpen(false);
      setNewRegionName("");
    },
    onError: (err) => message.error(get(err, "response.data.message", "Xatolik yuz berdi")),
  });

  const createDistrictMutation = useMutation({
    mutationFn: ({ regionId, name }) => api.post("/location/district", { regionId, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["regions-list"] });
      message.success("Tuman muvaffaqiyatli qo'shildi!");
      setIsDistrictModalOpen(false);
      setNewDistrictName("");
      setInlineDistrictName("");
    },
    onError: (err) => message.error(get(err, "response.data.message", "Xatolik yuz berdi")),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: ({ id, type }) => api.delete(`/location/${id}/${type}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions-list"] });
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      message.success("O'chirildi!");
    },
    onError: (err) => message.error(get(err, "response.data.message", "Xatolik yuz berdi")),
  });

  // Filtered regions & districts
  const filteredRegions = useMemo(() => {
    if (!searchRegion.trim()) return regionsList;
    const q = searchRegion.toLowerCase();
    return regionsList.filter((r) => r.name?.toLowerCase().includes(q));
  }, [regionsList, searchRegion]);

  const filteredDistricts = useMemo(() => {
    if (!searchDistrict.trim()) return districtsList;
    const q = searchDistrict.toLowerCase();
    return districtsList.filter((d) => d.name?.toLowerCase().includes(q) || d.id?.toString().includes(q));
  }, [districtsList, searchDistrict]);

  const handleInlineDistrictAdd = () => {
    if (!activeRegion) return message.warning("Viloyatni tanlang!");
    if (!inlineDistrictName.trim()) return message.warning("Tuman nomini kiriting!");
    createDistrictMutation.mutate({
      regionId: activeRegion.id,
      name: inlineDistrictName.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            Hududlar & Manzillar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            O'zbekiston viloyatlari, shahar va tumanlari geolokatsiya ierarxiyasi.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRegionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Viloyat Qo'shish</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami Viloyatlar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalRegions} ta</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Viloyat va Toshkent sh.</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Map className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1">
                Tuman & Shaharlar
              </div>
              <div className="text-2xl font-black text-purple-600 mt-1">{stats.totalDistricts} ta</div>
              <div className="text-[11px] text-purple-600/70 mt-0.5">Barcha hududiy bo'linmalar</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                Respublika Qamrovi
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">100% To'liq</div>
              <div className="text-[11px] text-emerald-600/70 mt-0.5">Barcha hududlar faol</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                Tanlangan Hudud
              </div>
              <div className="text-lg font-black text-amber-600 mt-1 truncate max-w-[150px]">
                {stats.activeRegionName}
              </div>
              <div className="text-[11px] text-amber-600/70 mt-0.5">{districtsList.length} ta tuman</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
          </div>
        </Col>
      </Row>

      {/* 2-Column Geography Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Regions List */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Map className="w-4 h-4 text-indigo-500" />
              Viloyatlar ({filteredRegions.length})
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Viloyat qidirish..."
                value={searchRegion}
                onChange={(e) => setSearchRegion(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none w-36"
              />
            </div>
          </div>

          {/* Regions list */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
            {filteredRegions.map((region) => {
              const isSelected = activeRegion?.id === region.id;
              return (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-50/90 border-indigo-200 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-white text-slate-700 shadow-2xs"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`font-black text-sm truncate ${
                          isSelected ? "text-indigo-900" : "text-slate-800"
                        }`}
                      >
                        {region.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: #{region.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Popconfirm
                      title="Viloyatni o'chirishga ishonchingiz komilmi?"
                      onConfirm={(e) => {
                        e.stopPropagation();
                        deleteLocationMutation.mutate({ id: region.id, type: "region" });
                      }}
                      okText="Ha"
                      cancelText="Bekor"
                      okButtonProps={{ danger: true }}
                    >
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Popconfirm>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Districts List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-500" />
                {activeRegion ? activeRegion.name : "Viloyat"} tumanlari ({districtsList.length} ta)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Ushbu viloyatga biriktirilgan tuman va shaharchalar</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tuman qidirish..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none w-36"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsDistrictModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tuman qo'shish</span>
              </button>
            </div>
          </div>

          {/* Fast inline add input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Yangi tuman nomini yozing (${activeRegion?.name || "Viloyat"} uchun)...`}
              value={inlineDistrictName}
              onChange={(e) => setInlineDistrictName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInlineDistrictAdd();
              }}
              className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold outline-none focus:border-purple-600 focus:bg-white"
            />
            <button
              type="button"
              onClick={handleInlineDistrictAdd}
              disabled={createDistrictMutation.isPending}
              className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              Qo'shish
            </button>
          </div>

          {/* Districts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[420px] pr-1 mt-1">
            {filteredDistricts.length === 0 && (
              <div className="sm:col-span-2 text-center py-12 text-slate-400 text-xs italic">
                Ushbu viloyatda hali tumanlar topilmadi.
              </div>
            )}
            {filteredDistricts.map((district) => (
              <div
                key={district.id}
                className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shadow-2xs hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-800 text-xs truncate">{district.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: #{district.id}</div>
                  </div>
                </div>

                <Popconfirm
                  title="Tumanni o'chirishga ishonchingiz komilmi?"
                  onConfirm={() => deleteLocationMutation.mutate({ id: district.id, type: "district" })}
                  okText="Ha"
                  cancelText="Bekor"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    type="button"
                    className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Popconfirm>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Region Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">Yangi Viloyat Qo'shish</span>
          </div>
        }
        open={isRegionModalOpen}
        onCancel={() => setIsRegionModalOpen(false)}
        onOk={() => {
          if (!newRegionName.trim()) return message.warning("Nomini kiriting!");
          createRegionMutation.mutate(newRegionName.trim());
        }}
        confirmLoading={createRegionMutation.isPending}
        okText="Qo'shish"
        cancelText="Bekor"
        className="!rounded-3xl"
        width={440}
      >
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">Viloyat Nomi:</label>
          <Input
            placeholder="Masalan: Toshkent viloyati, Samarqand"
            value={newRegionName}
            onChange={(e) => setNewRegionName(e.target.value)}
            className="!rounded-xl h-11 font-semibold"
          />
        </div>
      </Modal>

      {/* Add District Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span className="font-black text-slate-900">
              Yangi Tuman Qo'shish ({activeRegion?.name})
            </span>
          </div>
        }
        open={isDistrictModalOpen}
        onCancel={() => setIsDistrictModalOpen(false)}
        onOk={() => {
          if (!newDistrictName.trim()) return message.warning("Nomini kiriting!");
          createDistrictMutation.mutate({
            regionId: activeRegion.id,
            name: newDistrictName.trim(),
          });
        }}
        confirmLoading={createDistrictMutation.isPending}
        okText="Qo'shish"
        cancelText="Bekor"
        className="!rounded-3xl"
        width={440}
      >
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Tegishli Viloyat:</label>
            <div className="p-3 bg-slate-100 rounded-xl font-bold text-xs text-slate-800">
              {activeRegion?.name} (ID: #{activeRegion?.id})
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Tuman Nomi:</label>
            <Input
              placeholder="Masalan: Mirzo Ulug'bek tumani, Urgut tumani"
              value={newDistrictName}
              onChange={(e) => setNewDistrictName(e.target.value)}
              className="!rounded-xl h-11 font-semibold"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Locations;
