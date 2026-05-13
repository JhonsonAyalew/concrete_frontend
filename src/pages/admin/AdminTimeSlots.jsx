import { useState, useEffect } from 'react';
import { equipmentService } from '../../services/equipmentService';
import { timeSlotService } from '../../services/index';
import { Button, Modal, SectionHeader, Input, Select, ConfirmDialog, SearchInput } from '../../components/ui';
import { Plus, Edit, Trash2, Clock, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
const DAYS = ['all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export default function AdminTimeSlots() {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedEquipmentDetail, setSelectedEquipmentDetail] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalSlotsRevenue, setTotalSlotsRevenue] = useState(0);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  useEffect(() => {
    loadEquipment();
  }, []);
  const loadEquipment = async () => {
    try {
      const response = await equipmentService.getAll({ limit: 100, status: 'active' });
      const equipmentList = response.data?.data || [];
      setEquipment(equipmentList);
      setFilteredEquipment(equipmentList);
    } catch (error) {
      toast.error('Failed to load equipment');
    }
  };
  useEffect(() => {
    const filtered = equipment.filter(eq =>
      eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEquipment(filtered);
  }, [searchTerm, equipment]);
  const loadSlots = async (eq) => {
    setSelected(eq);
    setLoading(true);
    try {
      const response = await timeSlotService.getByEquipment(eq.id, true);
      const data = response?.data || response;
      setSelectedEquipmentDetail(data.equipment || eq);
      setSelectedOwner(data.owner);
      setSlots(data.time_slots || []);
      const totalRevenue = (data.time_slots || []).reduce((sum, slot) => {
        if (slot.is_active && slot.effective_price) {
          return sum + slot.effective_price;
        }
        return sum;
      }, 0);
      setTotalSlotsRevenue(totalRevenue);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load time slots');
      setSlots([]);
      setTotalSlotsRevenue(0);
    }
    setLoading(false);
  };
  const openCreate = () => {
    setEditSlot(null);
    reset({
      name: '',
      day_of_week: 'all',
      start_time: '08:00',
      end_time: '17:00',
      price_override: '',
      is_active: true,
      max_bookings_per_day: 1,
      buffer_time_minutes: 0
    });
    setModalOpen(true);
  };
  const openEdit = (slot) => {
    setEditSlot(slot);
    reset({
      name: slot.name,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      price_override: slot.price_override || '',
      is_active: slot.is_active,
      max_bookings_per_day: slot.max_bookings_per_day || 1,
      buffer_time_minutes: slot.buffer_time_minutes || 0
    });
    setModalOpen(true);
  };
  const onSubmit = async (data) => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = {
        name: data.name.trim(),
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        price_override: data.price_override && data.price_override !== '' ? Number(data.price_override) : null,
        is_active: data.is_active === true || data.is_active === 'true' || data.is_active === 'on',
        max_bookings_per_day: Number(data.max_bookings_per_day) || 1,
        buffer_time_minutes: Number(data.buffer_time_minutes) || 0
      };
      if (editSlot) {
        await timeSlotService.update(selected.id, editSlot.id, payload);
        toast.success('Time slot updated successfully');
      } else {
        await timeSlotService.create(selected.id, payload);
        toast.success('Time slot created successfully');
      }
      setModalOpen(false);
      loadSlots(selected);
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const messages = error.response.data.errors.map(e => e.msg).join(', ');
        toast.error(messages);
      } else {
        toast.error('Failed to save time slot');
      }
    }
    setSaving(false);
  };
  const handleDelete = async () => {
    try {
      await timeSlotService.delete(selected.id, deleteTarget.id);
      toast.success('Time slot deleted successfully');
      setDeleteTarget(null);
      loadSlots(selected);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete time slot');
    }
  };
  const handleToggleStatus = async (slot) => {
    try {
      await timeSlotService.toggleStatus(selected.id, slot.id);
      toast.success(`Time slot ${slot.is_active ? 'deactivated' : 'activated'} successfully`);
      loadSlots(selected);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };
  const calculateSlotDuration = (start, end) => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    if (endMinutes > startMinutes) {
      return endMinutes - startMinutes;
    } else {
      return (24 * 60 - startMinutes) + endMinutes;
    }
  };
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };
  const formatDay = (day) => {
    if (day === 'all') return 'Every Day';
    return day.charAt(0).toUpperCase() + day.slice(1);
  };
  return (
    <div className="space-y-5">
      <SectionHeader 
        title="Time Slot Management" 
        subtitle="Control equipment availability with custom time slots and pricing" 
      />
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Equipment List with Search */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>
                Equipment List
              </p>
              <span className="text-xs text-[var(--text-muted)]">{filteredEquipment.length} items</span>
            </div>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, brand, or city..."
              className="w-full"
            />
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {filteredEquipment.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] p-4 text-center">
                {searchTerm ? 'No matching equipment found' : 'No active equipment found'}
              </p>
            ) : (
              filteredEquipment.map(eq => (
                <button
                  key={eq.id}
                  onClick={() => loadSlots(eq)}
                  className={`w-full text-left p-3.5 border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-secondary)] ${
                    selected?.id === eq.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                  }`}
                >
                  <p className={`text-sm font-semibold truncate ${selected?.id === eq.id ? 'text-brand-500' : 'text-[var(--text)]'}`} style={{ fontFamily: 'Syne,sans-serif' }}>
                    {eq.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {eq.brand} · {eq.city}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
        {/* Slots Panel */}
        <div className="lg:col-span-2 card overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <Clock className="w-12 h-12 text-[var(--text-muted)] mb-3 opacity-30" />
              <p className="text-[var(--text-muted)] text-sm">Select equipment to manage its time slots</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>
                      {selectedEquipmentDetail?.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {selectedEquipmentDetail?.brand} · {selectedEquipmentDetail?.city}
                    </p>
                    {selectedOwner && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Owner: {selectedOwner.name} ({selectedOwner.email})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">Total Slots</p>
                      <p className="text-sm font-bold text-brand-500">{slots.length}</p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="w-4 h-4" /> Add Slot
                    </Button>
                  </div>
                </div>
              </div>
              {/* Equipment Pricing Display */}
              {selectedEquipmentDetail && (
                <div className="p-3 mx-4 mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-600 mb-2">Equipment Base Pricing (Admin Edited Price)</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {selectedEquipmentDetail.price_per_hour && (
                      <span className="px-2 py-1 rounded bg-white dark:bg-blue-900/50 font-semibold">
                        Hourly: ETB {Number(selectedEquipmentDetail.price_per_hour).toLocaleString()}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded bg-white dark:bg-blue-900/50 font-semibold">
                      Daily: ETB {Number(selectedEquipmentDetail.price_per_day).toLocaleString()}
                    </span>
                    {selectedEquipmentDetail.price_per_week && (
                      <span className="px-2 py-1 rounded bg-white dark:bg-blue-900/50 font-semibold">
                        Weekly: ETB {Number(selectedEquipmentDetail.price_per_week).toLocaleString()}
                      </span>
                    )}
                    {selectedEquipmentDetail.price_per_month && (
                      <span className="px-2 py-1 rounded bg-white dark:bg-blue-900/50 font-semibold">
                        Monthly: ETB {Number(selectedEquipmentDetail.price_per_month).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="skeleton h-20 rounded-xl" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-[var(--text-muted)]">No time slots configured for this equipment</p>
                    <Button size="sm" onClick={openCreate} className="mt-3">
                      <Plus className="w-4 h-4" /> Add First Slot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots.map(slot => {
                      const duration = calculateSlotDuration(slot.start_time, slot.end_time);
                      const durationHours = duration / 60;
                      const effectivePrice = slot.effective_price || slot.price_override || selectedEquipmentDetail?.price_per_hour || selectedEquipmentDetail?.price_per_day / 8;
                      return (
                        <div key={slot.id} className="flex items-start justify-between p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:shadow-md transition-all">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${slot.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-[var(--text)]">{slot.name}</p>
                                {slot.price_override && (
                                  <span className="text-xs font-bold text-brand-500 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
                                    Override: ETB {Number(slot.price_override).toLocaleString()}/hr
                                  </span>
                                )}
                                {!slot.is_active && (
                                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Inactive</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[var(--text-muted)]">
                                <span className="capitalize">{formatDay(slot.day_of_week)}</span>
                                <span>⏰ {slot.start_time} – {slot.end_time}</span>
                                <span>📊 {formatDuration(duration)} ({durationHours.toFixed(1)} hours)</span>
                                <span>💰 ETB {(effectivePrice * durationHours).toLocaleString()} per slot</span>
                              </div>
                              <div className="flex gap-3 mt-1 text-[10px] text-[var(--text-muted)]">
                                <span>Max bookings: {slot.max_bookings_per_day}</span>
                                <span>Buffer: {slot.buffer_time_minutes} min</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleToggleStatus(slot)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                slot.is_active 
                                  ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' 
                                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                              title={slot.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(slot)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(slot)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Revenue Summary */}
              {slots.length > 0 && (
                <div className="p-4 border-t border-[var(--border)] bg-gradient-to-r from-brand-50 to-orange-50 dark:from-brand-900/10 dark:to-orange-900/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Active Slots</p>
                      <p className="text-lg font-bold text-green-500">{slots.filter(s => s.is_active).length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Inactive Slots</p>
                      <p className="text-lg font-bold text-gray-500">{slots.filter(s => !s.is_active).length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Avg Price/Hour</p>
                      <p className="text-lg font-bold text-brand-500">
                        ETB {slots.length > 0 ? Math.round(slots.reduce((sum, s) => sum + (s.effective_price || 0), 0) / slots.length).toLocaleString() : 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Max Daily Revenue</p>
                      <p className="text-lg font-bold text-purple-500">
                        ETB {Math.round(slots.reduce((sum, s) => {
                          if (!s.is_active) return sum;
                          const duration = calculateSlotDuration(s.start_time, s.end_time) / 60;
                          const price = s.effective_price || 0;
                          return sum + (price * duration);
                        }, 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSlot ? 'Edit Time Slot' : 'New Time Slot'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>Save Slot</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Slot Name"
            placeholder="Morning Shift, Afternoon Slot, etc."
            error={errors.name?.message}
            {...register('name', { required: 'Slot name is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Day of Week" {...register('day_of_week')}>
              {DAYS.map(d => (
                <option key={d} value={d} className="capitalize">
                  {d === 'all' ? 'Every Day' : d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </Select>
            <Input
              label="Price Override (ETB/hour)"
              type="number"
              step="0.01"
              placeholder="Leave empty to use equipment price"
              {...register('price_override')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              error={errors.start_time?.message}
              {...register('start_time', { required: 'Start time is required' })}
            />
            <Input
              label="End Time"
              type="time"
              error={errors.end_time?.message}
              {...register('end_time', { required: 'End time is required' })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Bookings Per Day"
              type="number"
              min="1"
              defaultValue={1}
              {...register('max_bookings_per_day')}
            />
            <Input
              label="Buffer Time (minutes)"
              type="number"
              min="0"
              step="15"
              defaultValue={0}
              {...register('buffer_time_minutes')}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand-500"
              defaultChecked={true}
              {...register('is_active')}
            />
            <span className="text-sm text-[var(--text)]">Active (visible to customers)</span>
          </label>
          {selectedEquipmentDetail && !editSlot && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400">
              <p className="font-semibold mb-1">💡 Price Calculation:</p>
              <p>If no price override, the system will use equipment's hourly rate: ETB {Number(selectedEquipmentDetail.price_per_hour || selectedEquipmentDetail.price_per_day / 8).toLocaleString()}/hour</p>
            </div>
          )}
        </form>
      </Modal>
      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Time Slot"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}