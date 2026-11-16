type HeaderProps = {
  theme: 'dark' | 'light'
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>
}

export default function Header({ theme, setTheme }: HeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="Nexo, início">
        <span className="brand-symbol">N</span>
        <span>nexo<span className="brand-dot">.</span></span>
      </a>
      <nav aria-label="Navegação principal">
        <a href="#explorar">Explorar</a>
        <a href="#categorias">Categorias</a>
        <a href="#resultados">Resultados</a>
      </nav>
      <a className="access-button" href="#explorar">Descobrir</a>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
      </button>
    </header>
  )
}
