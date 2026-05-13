import { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Button, Table, Modal, SectionHeader, Input, ConfirmDialog, Avatar } from '../../components/ui';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState:{errors} } = useForm();
  const fetch = async () => {
    setLoading(true);
    try { const { data } = await adminService.getAdmins(); setAdmins(data.data||[]); }
    catch { setAdmins([]); }
    setLoading(false);
  };
  useEffect(()=>{ fetch(); },[]);
  const onSubmit = async (data) => {
  setSaving(true);
  try {
    const response = await adminService.createAdmin(data);
    // Check if it was a promotion or new creation
    const message = response.data?.message || 'Admin created!';
    toast.success(message);
    setModalOpen(false);
    reset();
    fetch();
  } catch (e) {
    const errorMsg = e.response?.data?.message || 'Failed to create admin';
    toast.error(errorMsg);
  }
  setSaving(false);
};
  const handleDelete = async () => {
    try { await adminService.deleteAdmin(deleteTarget.id); toast.success('Admin removed'); setDeleteTarget(null); fetch(); }
    catch { toast.error('Delete failed'); }
  };
  const columns = [
    { key:'avatar_url', label:'', width:'48px', render:(v,r)=><Avatar src={v} name={r.name} size="sm"/> },
    { key:'name', label:'Name', render:(v,r)=><div><p className="font-semibold text-sm text-[var(--text)]">{v}</p><p className="text-xs text-[var(--text-muted)]">{r.email}</p></div> },
    { key:'role', label:'Role', render:(v)=><span className="badge badge-brand capitalize">{v}</span> },
    { key:'created_at', label:'Added', render:(v)=><span className="text-xs text-[var(--text-muted)]">{v?format(new Date(v),'dd MMM yyyy'):'—'}</span> },
    { key:'id', label:'Actions', width:'80px', render:(_,row)=>(
      <Button size="sm" variant="ghost" className="text-red-500" onClick={()=>setDeleteTarget(row)}><Trash2 className="w-3.5 h-3.5"/></Button>
    )},
  ];
  return (
    <div className="space-y-5">
      <SectionHeader title="Administrators" subtitle="Manage admin accounts" action={<Button onClick={()=>{reset();setModalOpen(true);}}><Plus className="w-4 h-4"/>Add Admin</Button>} />
      <div className="card overflow-hidden">
        <Table columns={columns} data={admins} loading={loading} emptyText="No admins found" />
      </div>
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Create Admin Account"
        footer={<><Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit(onSubmit)} loading={saving}>Create Admin</Button></>}>
        <form className="space-y-4">
          <Input label="Full Name" error={errors.name?.message} {...register('name',{required:'Required'})} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email',{required:'Required',pattern:{value:/^\S+@\S+$/i,message:'Invalid'}})} />
          <Input label="Password" type="password" error={errors.password?.message} {...register('password',{required:'Required',minLength:{value:8,message:'Min 8 chars'}})} />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove Admin" message={`Remove admin "${deleteTarget?.name}"? They will lose admin access.`} />
    </div>
  );
}
