'use client'

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '2rem',
      padding: '1rem'
    }}>
      <div style={{
        position: 'relative',
        width: '12rem',
        height: 'auto'
      }}>
        <img
          src="/logo.png"
          alt="Geo E Logo"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#333'
      }}>
        Geo E
      </h1>
    </div>
  )
}