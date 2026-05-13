import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services';
import { Button, Table, StatusBadge, Modal, SearchInput, Pagination, SectionHeader, ConfirmDialog, Avatar } from '../../components/ui';
import { Eye, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
export default function AdminOwners() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewItem, setViewItem] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll({ role:'owner', search, page, limit:15 });
      setUsers(data.data||[]); setTotal(data.total||0);
    } catch { setUsers([]); }
    setLoading(false);
  }, [search, page]);
  useEffect(()=>{ fetch(); },[fetch]);
  const handleAction = async () => {
    try {
      if (actionTarget.status==='suspended') await userService.activate(actionTarget.id);
      else await userService.suspend(actionTarget.id);
      toast.success(t('adminOwners.toast.success'));
      setActionTarget(null); 
      fetch();
    } catch { 
      toast.error(t('adminOwners.toast.error')); 
    }
  };
  const columns = [
    { key:'avatar_url', label:'', width:'48px', render:(v,r)=><Avatar src={v} name={r.name} size="sm"/> },
    { key:'name', label:t('adminOwners.columns.owner'), render:(v,r)=><div><p className="font-semibold text-sm text-[var(--text)]">{v}</p><p className="text-xs text-[var(--text-muted)]">{r.company_name||r.email}</p></div> },
    { key:'city', label:t('adminOwners.columns.city'), render:(v)=><span className="text-sm">{v||'—'}</span> },
    { key:'id_verified', label:t('adminOwners.columns.verified'), render:(v)=>v?<span className="badge badge-success">{t('adminOwners.verified.verified')}</span>:<span className="badge badge-warning">{t('adminOwners.verified.unverified')}</span> },
    { key:'status', label:t('adminOwners.columns.status'), render:(v)=><StatusBadge status={v}/> },
    { key:'created_at', label:t('adminOwners.columns.joined'), render:(v)=><span className="text-xs text-[var(--text-muted)]">{v?format(new Date(v),'dd MMM yyyy'):'—'}</span> },
    { key:'id', label:t('adminOwners.columns.actions'), width:'100px', render:(_,row)=>(
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={()=>setViewItem(row)}><Eye className="w-3.5 h-3.5"/></Button>
        <Button size="sm" variant="ghost" className={row.status==='suspended'?'text-green-500':'text-amber-500'} onClick={()=>setActionTarget(row)}>
          {row.status==='suspended'?<CheckCircle className="w-3.5 h-3.5"/>:<Ban className="w-3.5 h-3.5"/>}
        </Button>
      </div>
    )},
  ];
  return (
    <div className="space-y-5">
      <SectionHeader 
        title={t('adminOwners.header.title')} 
        subtitle={t('adminOwners.header.subtitle', { count: total })} 
      />
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <SearchInput 
            value={search} 
            onChange={(v)=>{setSearch(v);setPage(1);}} 
            placeholder={t('adminOwners.searchPlaceholder')} 
            className="w-full sm:w-72" 
          />
        </div>
        <Table 
          columns={columns} 
          data={users} 
          loading={loading} 
          emptyText={t('adminOwners.emptyText')} 
        />
        <div className="px-4">
          <Pagination 
            page={page} 
            totalPages={Math.ceil(total/15)} 
            onPageChange={setPage} 
          />
        </div>
      </div>
      {/* View Owner Modal */}
      <Modal open={!!viewItem} onClose={()=>setViewItem(null)} title={t('adminOwners.modal.title')}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
              <Avatar src={viewItem.avatar_url} name={viewItem.name} size="xl"/>
              <div>
                <p className="text-lg font-bold text-[var(--text)]">{viewItem.name}</p>
                <p className="text-[var(--text-muted)]">{viewItem.email}</p>
                {viewItem.company_name && <p className="text-sm text-brand-500">{viewItem.company_name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                [t('adminOwners.modal.fields.phone'), viewItem.phone],
                [t('adminOwners.modal.fields.city'), viewItem.city],
                [t('adminOwners.modal.fields.company'), viewItem.company_name],
                [t('adminOwners.modal.fields.idVerified'), viewItem.id_verified ? t('adminOwners.modal.fields.yes') : t('adminOwners.modal.fields.no')]
              ].map(([k,v]) => (
                <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-xs text-[var(--text-muted)]">{k}</p>
                  <p className="font-semibold text-[var(--text)] mt-0.5">{v || '—'}</p>
                </div>
              ))}
            </div>
            {viewItem.bio && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">{t('adminOwners.modal.fields.bio')}</p>
                <p>{viewItem.bio}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog 
        open={!!actionTarget} 
        onClose={()=>setActionTarget(null)} 
        onConfirm={handleAction}
        title={actionTarget?.status==='suspended' ? t('adminOwners.confirm.activateTitle') : t('adminOwners.confirm.suspendTitle')}
        message={t('adminOwners.confirm.message', { 
          action: actionTarget?.status==='suspended' ? t('adminOwners.confirm.activate') : t('adminOwners.confirm.suspend'),
          name: actionTarget?.name || ''
        })}
        type={actionTarget?.status==='suspended' ? 'warning' : 'danger'} 
      />
    </div>
  );
}