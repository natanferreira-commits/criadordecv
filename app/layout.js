import './globals.css'

export const metadata = {
  title: 'CV Generator',
  description: 'Gere CVs personalizados para cada vaga',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
