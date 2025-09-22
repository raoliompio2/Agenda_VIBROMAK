'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LogIn, 
  User, 
  Settings, 
  LogOut, 
  Calendar,
  Menu,
  X,
  Plus,
  RefreshCw
} from 'lucide-react'

export function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLoginClick = () => {
    router.push('/admin/login')
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <header className="bg-vibromak-primary shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="https://vibromak.com.br/wp-content/uploads/2024/05/cropped-Design-sem-nome-300x47.png"
              alt="Vibromak Logo" 
              className="h-8 lg:h-10 w-auto"
            />
          </Link>


          {/* User Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : session ? (
              <div className="flex items-center space-x-3">
                <Card className="bg-white/10 backdrop-blur border-white/20">
                  <CardContent className="p-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-white" />
                      <span className="text-white text-sm font-medium">
                        {session.user?.name || session.user?.email}
                      </span>
                      <Badge variant="outline" className="bg-vibromak-secondary text-white border-white/30">
                        Admin
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Link href="/agendar">
                  <Button 
                    size="sm"
                    className="bg-vibromak-secondary hover:bg-vibromak-secondary/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Criar
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <Link href="/admin">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Painel
                  </Button>
                </Link>
                
                <Link href="/admin/settings">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-red-500/20 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLoginClick}
                className="bg-vibromak-secondary hover:bg-vibromak-secondary/90 text-white font-semibold px-6"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login Admin
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:text-vibromak-secondary hover:bg-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="space-y-2">
              <div>
                {session ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2">
                      <div className="flex items-center space-x-2 text-white text-sm">
                        <User className="h-4 w-4" />
                        <span>{session.user?.name || session.user?.email}</span>
                        <Badge variant="outline" className="bg-vibromak-secondary text-white border-white/30 text-xs">
                          Admin
                        </Badge>
                      </div>
                    </div>
                    <Link 
                      href="/agendar"
                      className="block py-2 px-4 text-white bg-vibromak-secondary hover:bg-vibromak-secondary/90 rounded transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Plus className="h-4 w-4 inline mr-2" />
                      Criar Agendamento
                    </Link>
                    <button 
                      onClick={() => {
                        handleRefresh()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left py-2 px-4 text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                    >
                      <RefreshCw className="h-4 w-4 inline mr-2" />
                      Atualizar
                    </button>
                    <Link 
                      href="/admin"
                      className="block py-2 px-4 text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Painel Admin
                    </Link>
                    <Link 
                      href="/admin/settings"
                      className="block py-2 px-4 text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 inline mr-2" />
                      Configurações
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left py-2 px-4 text-white bg-white/10 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <LogOut className="h-4 w-4 inline mr-2" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      handleLoginClick()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left py-2 px-4 bg-vibromak-secondary hover:bg-vibromak-secondary/90 text-white rounded transition-colors font-medium"
                  >
                    <LogIn className="h-4 w-4 inline mr-2" />
                    Login Admin
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
