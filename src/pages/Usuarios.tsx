import { Check, Eye, Lock, Mail, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DevNotice, PreviewBanner } from '@/components/layout/Notices'
import { Avatar, Badge, Button, Card, CardHead, Modal, PageHeader, Select } from '@/components/ui'
import { tr, useT } from '@/i18n'
import { fmtRel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MIN, NOW, vendedores } from '@/mock/base'
import type { Role } from '@/mock/types'
import { useApp } from '@/store/app'
import { Toggle } from './auto/Reparto'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Role
  bdc: string
  activo: boolean
  ultimo: number
  avatar: string
  color: string
}

const iniciales: Usuario[] = [
  { id: 'u0', nombre: 'Miguel Campos', email: 'miguel@camposcrm.demo', rol: 'admin', bdc: '—', activo: true, ultimo: NOW - 1 * MIN, avatar: 'MC', color: '#3b82f6' },
  { id: 'u9', nombre: 'Sofía Herrera', email: 'sofia@camposcrm.demo', rol: 'admin', bdc: '—', activo: true, ultimo: NOW - 95 * MIN, avatar: 'SH', color: '#60a5fa' },
  ...vendedores.map((v) => ({ id: v.id, nombre: v.nombre, email: v.email, rol: 'vendedor' as Role, bdc: v.bdc, activo: v.activo, ultimo: v.ultimoAcceso, avatar: v.avatar, color: v.color })),
]

const PERMISOS = ['verTodos', 'verEquipo', 'gestionarUsuarios', 'asignar', 'enviarWa', 'editarAuto', 'verComoCloser'] as const
const matriz: Record<Role, Record<(typeof PERMISOS)[number], boolean>> = {
  admin: { verTodos: true, verEquipo: true, gestionarUsuarios: true, asignar: true, enviarWa: true, editarAuto: true, verComoCloser: true },
  vendedor: { verTodos: false, verEquipo: false, gestionarUsuarios: false, asignar: false, enviarWa: true, editarAuto: false, verComoCloser: false },
}

export default function Usuarios() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const [users, setUsers] = useState(iniciales)
  const [inv, setInv] = useState(false)
  const [email, setEmail] = useState('')
  const [rolInv, setRolInv] = useState<Role>('vendedor')
  const L = () => useApp.getState().lang

  const upd = (id: string, patch: Partial<Usuario>) => setUsers((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const invitar = () => {
    const nombre = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    setUsers((u) => [...u, { id: `inv${u.length}`, nombre, email, rol: rolInv, bdc: rolInv === 'admin' ? '—' : 'BDC Norte', activo: true, ultimo: 0, avatar: nombre.slice(0, 2).toUpperCase(), color: '#a78bfa' }])
    toast.success(tr('toast.invitado', L(), { e: email }), { description: tr('dev.invitar.texto', L()) })
    setEmail('')
    setInv(false)
  }

  return (
    <div>
      <PreviewBanner id="usuarios" />
      <PageHeader
        kicker={t('kicker.equipo')}
        title={t('usr.titulo')}
        sub={t('usr.sub')}
        right={<Button variant="primary" onClick={() => setInv(true)} className="w-full sm:w-auto"><UserPlus size={16} /> {t('usr.invitar')}</Button>}
      />

      <Card className="mb-5">
        <CardHead title={t('usr.lista')} sub={t('usr.listaSub', { n: users.length })} />
        <div className="scroll-x hidden sm:block">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="bg-surface2/50">
              <tr className="text-left">
                <th className="label-up px-4 py-2">{t('usr.usuario')}</th>
                <th className="label-up px-2 py-2">{t('usr.rol')}</th>
                <th className="label-up px-2 py-2">BDC</th>
                <th className="label-up px-2 py-2">{t('usr.ultimoAcceso')}</th>
                <th className="label-up px-2 py-2">{t('usr.activo')}</th>
                <th className="label-up px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={cn('border-t border-line', !u.activo && 'opacity-55')}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={u.avatar} color={u.color} size={30} />
                      <div>
                        <div className="font-semibold">{u.nombre}</div>
                        <div className="text-[11.5px] text-fg2">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <Select
                      ariaLabel={t('usr.rol')}
                      value={u.rol}
                      onChange={(r) => {
                        upd(u.id, { rol: r as Role })
                        toast.success(tr('toast.rolCambiado', L(), { n: u.nombre, r: tr(r === 'admin' ? 'rol.admin' : 'rol.vendedor', L()) }))
                      }}
                      className="h-10 w-40"
                    >
                      <option value="admin">{t('rol.admin')}</option>
                      <option value="vendedor">{t('rol.vendedor')}</option>
                    </Select>
                  </td>
                  <td className="px-2 py-2 text-fg2">{u.bdc}</td>
                  <td className="px-2 py-2 text-fg2">{u.ultimo ? fmtRel(u.ultimo, lang) : <Badge tone="warn">{t('usr.invitado')}</Badge>}</td>
                  <td className="px-2 py-1">
                    <Toggle
                      on={u.activo}
                      label={u.nombre}
                      onChange={(on) => {
                        upd(u.id, { activo: on })
                        toast.success(tr(on ? 'toast.usrActivado' : 'toast.usrDesactivado', L(), { n: u.nombre }))
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {u.rol === 'vendedor' && vendedores.some((v) => v.id === u.id) && (
                      <Button size="sm" variant="ghost" onClick={() => { useApp.getState().setViewAs(u.id); navigate('/mi-panel') }}>
                        <Eye size={15} /> {t('usr.verComo')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-line sm:hidden">
          {users.map((u) => (
            <div key={u.id} className={cn('flex items-center gap-3 p-3', !u.activo && 'opacity-55')}>
              <Avatar initials={u.avatar} color={u.color} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{u.nombre}</div>
                <div className="truncate text-[12px] text-fg2">{t(u.rol === 'admin' ? 'rol.admin' : 'rol.vendedor')} · {u.bdc} · {u.ultimo ? fmtRel(u.ultimo, lang) : t('usr.invitado')}</div>
              </div>
              <Toggle on={u.activo} label={u.nombre} onChange={(on) => { upd(u.id, { activo: on }); toast.success(tr(on ? 'toast.usrActivado' : 'toast.usrDesactivado', L(), { n: u.nombre })) }} />
            </div>
          ))}
        </div>
      </Card>

      <Card data-tour="permisos">
        <CardHead icon={<Lock size={16} />} title={t('usr.permisos')} sub={t('usr.permisosSub')} />
        <div className="p-4 sm:p-5">
          <DevNotice k="permisos" className="mb-4" />
          <div className="scroll-x">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className="label-up py-2">{t('usr.accion')}</th>
                  <th className="label-up px-3 py-2 text-center">{t('rol.admin')}</th>
                  <th className="label-up px-3 py-2 text-center">{t('rol.vendedor')}</th>
                </tr>
              </thead>
              <tbody>
                {PERMISOS.map((p) => (
                  <tr key={p} className="border-t border-line">
                    <td className="py-2.5 pr-3">{t(`usr.perm.${p}`)}</td>
                    {(['admin', 'vendedor'] as Role[]).map((r) => (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {matriz[r][p] ? <Check size={17} className="mx-auto text-ok" /> : <X size={17} className="mx-auto text-muted" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-fg2"><Lock size={13} /> {t('usr.validacion')}</p>
        </div>
      </Card>

      <Modal open={inv} onClose={() => setInv(false)} title={t('usr.invitar')} width={460}>
        <div className="space-y-4 p-5">
          <DevNotice k="invitar" />
          <label className="block">
            <span className="label-up">Email</span>
            <div className="relative mt-1.5">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nuevo@camposcrm.demo" />
            </div>
          </label>
          <label className="block">
            <span className="label-up">{t('usr.rol')}</span>
            <Select className="mt-1.5" value={rolInv} onChange={(r) => setRolInv(r as Role)}>
              <option value="vendedor">{t('rol.vendedor')}</option>
              <option value="admin">{t('rol.admin')}</option>
            </Select>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setInv(false)}>{t('common.cancelar')}</Button>
            <Button variant="primary" disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={invitar}><UserPlus size={16} /> {t('usr.enviarInvitacion')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
