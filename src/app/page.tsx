'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import {
  LogOut,
  Bot,
  Briefcase,
  Users,
  PieChart
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar Corporativo */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-[#254153] p-2.5 rounded-lg shadow-md">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl text-[#254153] leading-none tracking-tight">Negotiation<span className="text-blue-600">Pro</span></span>
                <span className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">PLATAFORMA CORPORATIVA</span>
              </div>
            </div>

            {/* Usuario y Logout */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
                <span className="text-sm font-semibold text-[#254153]">{user?.email}</span>
                <span className="text-xs text-slate-500">Usuario Autorizado</span>
              </div>
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#254153] transition-all duration-200 text-sm font-medium"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#254153] mb-4">Panel de Control</h1>
          <p className="text-slate-600 text-lg">Seleccione una opción para gestionar sus operaciones de negociación y proveedores.</p>
        </div>

        {/* Grid de Menú Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">


          {/* Opción 1: Realizar Negociación */}
          <div
            onClick={() => router.push('/negotiation/start')}
            className="group bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_20px_40px_-10px_rgba(37,65,83,0.1)] hover:border-[#254153]/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Bot className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#254153] transition-colors duration-300">
                <Briefcase className="w-7 h-7 text-[#254153] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-[#254153] mb-3 group-hover:translate-x-1 transition-transform">Realizar Negociación</h3>
              <p className="text-slate-500 mb-8 flex-grow">Inicie nuevos procesos de negociación automatizada con sus proveedores registrados.</p>
              <button className="w-full py-3 px-4 rounded-lg border-2 border-[#254153] text-[#254153] font-semibold text-sm group-hover:bg-[#254153] group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                Iniciar Proceso
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          {/* Opción 2: Ver Proveedores */}
          <div
            onClick={() => router.push('/suppliers')}
            className="group bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_20px_40px_-10px_rgba(37,65,83,0.1)] hover:border-[#254153]/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#254153] transition-colors duration-300">
                <Users className="w-7 h-7 text-[#254153] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-[#254153] mb-3 group-hover:translate-x-1 transition-transform">Ver Proveedores</h3>
              <p className="text-slate-500 mb-8 flex-grow">Gestione su base de datos de proveedores, historial y calificaciones de desempeño.</p>
              <button className="w-full py-3 px-4 rounded-lg border-2 border-[#254153] text-[#254153] font-semibold text-sm group-hover:bg-[#254153] group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                Gestionar Directorio
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          {/* Opción 3: Ver BI */}
          <div
            onClick={() => router.push('/bi')}
            className="group bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_20px_40px_-10px_rgba(37,65,83,0.1)] hover:border-[#254153]/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <PieChart className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#254153] transition-colors duration-300">
                <PieChart className="w-7 h-7 text-[#254153] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-[#254153] mb-3 group-hover:translate-x-1 transition-transform">Ver BI</h3>
              <p className="text-slate-500 mb-8 flex-grow">Acceda a análisis detallados, reportes de ahorro y métricas de rendimiento.</p>
              <button className="w-full py-3 px-4 rounded-lg border-2 border-[#254153] text-[#254153] font-semibold text-sm group-hover:bg-[#254153] group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                Consultar Reportes
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
